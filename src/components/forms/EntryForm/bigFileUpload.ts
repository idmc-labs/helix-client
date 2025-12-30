type UploadOptions = {
    file: File;
    url: string;
    onProgress: (percent: number) => void;
    onAbort: () => void;
    onError: (error: string | undefined) => void;
    onComplete: () => void;
    timeout?: number;
};

export default function uploadFileToPresignedUrl({
    file,
    url,
    onProgress,
    onAbort,
    onError,
    onComplete,
    timeout,
}: UploadOptions) {
    const xhr = new XMLHttpRequest();

    const abort = () => {
        if (xhr.readyState !== XMLHttpRequest.DONE) {
            xhr.abort();
        }
    };

    xhr.open('PUT', url);

    xhr.setRequestHeader('Content-Type', file.type);

    if (timeout) {
        xhr.timeout = timeout;
    }

    xhr.upload.onprogress = (event: ProgressEvent) => {
        if (!event.lengthComputable) {
            return;
        }

        const percent = Math.min(
            100,
            Math.round((event.loaded / event.total) * 100),
        );

        onProgress(percent);
    };

    xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
            onComplete();
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

    // Allow user to cancel upload
    return {
        abort,
        request: xhr,
    };
}
