export class JWTGenerator {
    private keyId: string;
    private issuerId: string;
    private privateKey: string;

    constructor(keyId: string, issuerId: string, privateKey: string) {
        this.keyId = keyId;
        this.issuerId = issuerId;
        // Normalize private key format
        this.privateKey = privateKey.replace(/\\n/g, '\n');
    }

    private async importPrivateKey(): Promise<CryptoKey> {
        try {
            // Clean and format the private key properly
            const pemHeader = "-----BEGIN PRIVATE KEY-----";
            const pemFooter = "-----END PRIVATE KEY-----";
            
            // Normalize the key: remove headers, footers, and whitespace
            let pemContents = this.privateKey;
            pemContents = pemContents.replace(pemHeader, '')
                                   .replace(pemFooter, '')
                                   .replace(/\s/g, '');

            // Ensure the base64 string is properly padded
            while (pemContents.length % 4) {
                pemContents += '=';
            }

            // Convert to binary data
            const binaryDer = this.base64ToArrayBuffer(pemContents);

            // Import as crypto key
            return await crypto.subtle.importKey(
                "pkcs8",
                binaryDer,
                {
                    name: "ECDSA",
                    namedCurve: "P-256",
                },
                false,
                ["sign"]
            );
        } catch (error) {
            console.error('Error importing private key:', error);
            throw error;
        }
    }

    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        try {
            // Ensure proper base64 padding
            let paddedBase64 = base64;
            while (paddedBase64.length % 4) {
                paddedBase64 += '=';
            }

            const binary = atob(paddedBase64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            return bytes.buffer;
        } catch (error) {
            console.error('Error converting base64 to ArrayBuffer:', error);
            throw error;
        }
    }

    private base64UrlEncode(str: string): string {
        return btoa(str)
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, "");
    }

    async generateToken(): Promise<string> {
        try {
            const header = {
                alg: "ES256",
                kid: this.keyId,
                typ: "JWT"
            };

            const payload = {
                iss: this.issuerId,
                exp: Math.floor(Date.now() / 1000) + 1200, // 20 minutes
                aud: "appstoreconnect-v1"
            };

            // Create base64url encoded parts
            const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
            const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));

            // Create signature input
            const signatureInput = `${encodedHeader}.${encodedPayload}`;

            // Sign the input
            const privateKey = await this.importPrivateKey();
            const signatureArray = await crypto.subtle.sign(
                {
                    name: "ECDSA",
                    hash: { name: "SHA-256" },
                },
                privateKey,
                new TextEncoder().encode(signatureInput)
            );

            // Convert signature to base64url
            const signature = this.base64UrlEncode(
                String.fromCharCode(...new Uint8Array(signatureArray))
            );

            // Combine all parts
            return `${signatureInput}.${signature}`;
        } catch (error) {
            console.error('Error generating token:', error);
            throw error;
        }
    }
}

// Usage example:
/*
const generator = new JWTGenerator(
    "HD3QW83C6M",
    "69a6de7a-14a3-47e3-e053-5b8c7c11a4d1",
    `-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgPR0x0Osv0U/M9pwt\nPnwoCeuAMXPEaBT8GYB8JKlR0QqgCgYIKoZIzj0DAQehRANCAAT7NBsF6Nl+aHbr\n8gm1wnPhgqUwdQmJb/scRUBTB2GLQ3E2Je9Ste5Sp/yUnfJYbEASiyg26Y0cSjaR\n6LaJVohp\n-----END PRIVATE KEY-----`
);

generator.generateToken().then(token => {	
    console.log('Token', token);
});
*/