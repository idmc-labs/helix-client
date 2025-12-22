type UploadProgress = {
    loaded: number;
    total: number;
    percent: number;
};

type UploadOptions = {
    file: File;
    url: string;
    onProgress: (progress: UploadProgress) => void;
    onAbort: () => void;
    onError: (error: string | undefined) => void;
    onComplete: () => void;
    delay?: number;
};

export default function uploadFileToPresignedUrl({
    file,
    url,
    onProgress,
    onAbort,
    onError,
    onComplete,
    delay = 0, // 0 = no timeout (recommended for large files)
}: UploadOptions) {
    const xhr = new XMLHttpRequest();

    try {
        xhr.open('PUT', url);

        xhr.setRequestHeader('Content-Type', file.type);

        if (delay > 0) {
            xhr.timeout = delay;
        }

        xhr.upload.onprogress = (event: ProgressEvent) => {
            if (!event.lengthComputable) {
                return;
            }

            const percent = Math.min(
                100,
                Math.round((event.loaded / event.total) * 100),
            );

            onProgress({
                loaded: event.loaded,
                total: event.total,
                percent,
            });
        };

        xhr.onload = () => {
            // S3 usually return 200 or 204
            if (xhr.status >= 200 && xhr.status < 300) {
                onComplete();
                return;
            }

            // Expired presigned URLs often return 403
            if (xhr.status === 403) {
                onError('Upload failed: presigned URL expired or invalid.');
                return;
            }

            onError(`Upload failed with status ${xhr.status}: ${xhr.statusText}`);
        };

        xhr.onerror = () => {
            onError('Network error during file upload.');
        };

        xhr.ontimeout = () => {
            onError('Upload timed out.');
        };

        xhr.onabort = () => {
            onAbort();
        };

        xhr.send(file);
    } catch (err) {
        onError('Unknown upload error');
    }

    // Allow user to cancel upload
    return {
        abort: () => {
            if (xhr.readyState !== XMLHttpRequest.DONE) {
                xhr.abort();
            }
        },
    };
}
