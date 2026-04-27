import * as ftp from "basic-ftp";
import { Readable } from "stream";

const FTP_HOST = process.env.HOSTINGER_SFTP_HOST!;
const FTP_USER = process.env.HOSTINGER_SFTP_USER!;
const FTP_PASS = process.env.HOSTINGER_SFTP_PASS!;
const FTP_BASE_DIR = "/";
const PUBLIC_BASE_URL = "https://petrosphere.com.ph/uploads/waspi";

/**
 * Upload a file buffer to Hostinger FTP and return the public URL.
 * Creates the target directory if it doesn't exist.
 */
export async function uploadToFTP(
    buffer: Buffer,
    fileName: string,
    subFolder: string = "receipts"
): Promise<string> {
    const client = new ftp.Client();
    client.ftp.verbose = false;

    try {
        await client.access({
            host: FTP_HOST,
            user: FTP_USER,
            password: FTP_PASS,
            secure: false,
        });

        const remotePath = `${FTP_BASE_DIR}/${subFolder}`;

        // Ensure folder exists
        await client.ensureDir(remotePath);

        // Upload the file
        const stream = Readable.from(buffer);
        await client.uploadFrom(stream, `${remotePath}/${fileName}`);

        return `${PUBLIC_BASE_URL}/${subFolder}/${fileName}`;
    } finally {
        client.close();
    }
}
