"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import jsQR - make sure you have it installed: npm install jsqr
// @ts-ignore
import jsQR from 'jsqr';

// Import your supabase client
// @ts-ignore
import { supabase } from '@/lib/supabase-client';

export function QRScanner({ eventId = "1" }: { eventId?: string }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [lastScan, setLastScan] = useState<{
    status: 'success' | 'error' | 'info';
    message: string;
    name?: string;
    time: Date;
  } | null>(null);
  const [recentScans, setRecentScans] = useState<Array<{
    id: number;
    name: string;
    status: 'success' | 'duplicate';
    time: Date;
  }>>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const lastScannedRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    setError('');
    console.log('Starting camera...');

    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      console.log('Requesting camera access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      console.log('Stream obtained:', stream.active);
      streamRef.current = stream;

      if (!videoRef.current) {
        setError('Video element not found');
        return;
      }

      const video = videoRef.current;
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('autoplay', 'true');
      video.setAttribute('muted', 'true');

      // Wait for the video to be ready
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Video load timeout'));
        }, 5000);

        video.onloadedmetadata = () => {
          console.log(`Video ready: ${video.videoWidth}x${video.videoHeight}`);
          clearTimeout(timeout);
          resolve();
        };

        video.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Video element error'));
        };
      });

      await video.play();
      console.log('Video playing!');
      
      setScanning(true);

      // Start QR code scanning
      scanIntervalRef.current = window.setInterval(() => {
        scanForQRCode();
      }, 300);

    } catch (err: any) {
      console.error('Camera error:', err);
      setError(err.message);
      setScanning(false);
    }
  };

  const stopScanning = () => {
    console.log('Stopping camera...');
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanning(false);
    lastScannedRef.current = '';
  };

  const scanForQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    if (canvas.width === 0 || canvas.height === 0) return;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Detect QR code
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code && code.data) {
      const now = Date.now();
      // Prevent duplicate scans within 3 seconds
      if (code.data !== lastScannedRef.current || now - lastScanTimeRef.current > 3000) {
        lastScannedRef.current = code.data;
        lastScanTimeRef.current = now;
        console.log('QR Code detected:', code.data);
        processQRCode(code.data);
      }
    }
  };

  const processQRCode = async (referenceId: string) => {
    try {
      console.log('Processing QR code for reference_id:', referenceId);
      
      // Fetch attendee by reference_id
      const { data: attendee, error: fetchError } = await supabase
        .from('attendees')
        .select('*')
        .eq('reference_id', referenceId)
        .eq('event_id', parseInt(eventId))
        .single();

      if (fetchError || !attendee) {
        console.error('Attendee not found:', fetchError);
        setLastScan({
          status: 'error',
          message: 'Attendee not found or not registered for this event',
          time: new Date()
        });
        playSound(400, 0.2);
        return;
      }

      console.log('Attendee found:', attendee);

      // Get current date (today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEpoch = today.getTime();

      // Check if already marked present today
      const attendance = attendee.attendance || [];
      const todayAttendance = attendance.find((a: any) => a.date === todayEpoch);

      if (todayAttendance && todayAttendance.status === 'Present') {
        console.log('Already marked present today');
        const attendeeName = `${attendee.personal_name} ${attendee.last_name}`;
        setLastScan({
          status: 'info',
          message: `${attendeeName} is already marked present today`,
          name: attendeeName,
          time: new Date()
        });
        setRecentScans(prev => [{
          id: attendee.id,
          name: attendeeName,
          status: 'duplicate',
          time: new Date()
        }, ...prev.slice(0, 9)]);
        playSound(600, 0.15);
        return;
      }

      // Mark as present
      const updatedAttendance = attendance.filter((a: any) => a.date !== todayEpoch);
      updatedAttendance.push({ date: todayEpoch, status: 'Present' });

      console.log('Updating attendance...');
      const { error: updateError } = await supabase
        .from('attendees')
        .update({ attendance: updatedAttendance })
        .eq('id', attendee.id);

      if (updateError) {
        console.error('Failed to update attendance:', updateError);
        setLastScan({
          status: 'error',
          message: 'Failed to update attendance',
          time: new Date()
        });
        playSound(400, 0.2);
        return;
      }

      // Success
      console.log('Attendance marked successfully');
      const attendeeName = `${attendee.personal_name} ${attendee.last_name}`;
      setLastScan({
        status: 'success',
        message: `Successfully marked ${attendeeName} as present`,
        name: attendeeName,
        time: new Date()
      });
      setRecentScans(prev => [{
        id: attendee.id,
        name: attendeeName,
        status: 'success',
        time: new Date()
      }, ...prev.slice(0, 9)]);

      // Play success sound
      playSound(800, 0.1);

    } catch (error) {
      console.error('Error processing QR code:', error);
      setLastScan({
        status: 'error',
        message: 'An error occurred while processing the QR code',
        time: new Date()
      });
      playSound(400, 0.2);
    }
  };

  const playSound = (frequency: number, duration: number) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.log('Could not play sound');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">QR Attendance Scanner</h1>
        <p className="text-muted-foreground mt-1">
          Scan attendee QR codes to mark them present for today
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Scanner Card */}
        <Card>
          <CardHeader>
            <CardTitle>Camera Scanner</CardTitle>
            <CardDescription>
              Position the QR code in front of the camera
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {scanning && (
                <>
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="border-4 border-green-500 rounded-lg w-64 h-64 animate-pulse shadow-lg shadow-green-500/50" />
                  </div>
                  
                  {/* Scanning status indicator */}
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    Scanning...
                  </div>
                </>
              )}

              {!scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 bg-gray-800">
                  <Camera className="h-16 w-16 text-gray-400" />
                  <p className="text-white text-center">Click "Start Scanning" to activate camera</p>
                </div>
              )}
            </div>

            <Button
              onClick={scanning ? stopScanning : startScanning}
              className="w-full"
              variant={scanning ? 'destructive' : 'default'}
            >
              {scanning ? (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Stop Scanning
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Start Scanning
                </>
              )}
            </Button>

            {lastScan && (
              <Alert 
                variant={lastScan.status === 'error' ? 'destructive' : 'default'}
                className={
                  lastScan.status === 'success' 
                    ? 'border-green-500 bg-green-50' 
                    : lastScan.status === 'info'
                    ? 'border-blue-500 bg-blue-50'
                    : ''
                }
              >
                {lastScan.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                {lastScan.status === 'error' && <XCircle className="h-4 w-4" />}
                {lastScan.status === 'info' && <AlertCircle className="h-4 w-4 text-blue-600" />}
                <AlertDescription>
                  <div className="font-medium">{lastScan.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatTime(lastScan.time)}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Recent Scans Card */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Scans</CardTitle>
            <CardDescription>
              Latest scanned attendees for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentScans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No scans yet. Start scanning to see results here.
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {recentScans.map((scan, index) => (
                  <div
                    key={`${scan.id}-${index}`}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      scan.status === 'success'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {scan.status === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <RefreshCw className="h-5 w-5 text-blue-600" />
                      )}
                      <div>
                        <div className="font-medium">{scan.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(scan.time)}
                        </div>
                      </div>
                    </div>
                    <div className={`text-xs font-medium px-2 py-1 rounded ${
                      scan.status === 'success'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {scan.status === 'success' ? 'Marked Present' : 'Already Present'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Click "Start Scanning" to activate the camera</li>
            <li>Position the attendee's QR code within the green scanning frame</li>
            <li>The system will automatically detect and process the QR code</li>
            <li>You'll hear a sound and see a notification when scanning is complete</li>
            <li>Each attendee can only be marked present once per day</li>
            <li>Recent scans will appear in the right panel</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}