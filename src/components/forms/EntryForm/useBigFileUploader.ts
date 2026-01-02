import {
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    isNotDefined,
} from '@togglecorp/fujs';
import {
    useMutation,
} from '@apollo/client';

import NotificationContext from '#components/NotificationContext';
import {
    CreateBigAttachmentMutation,
    CreateBigAttachmentMutationVariables,
    MarkAttachmentFileAsUploadedMutation,
    MarkAttachmentFileAsUploadedMutationVariables,
} from '#generated/types';

import uploadFileToPresignedUrl from './bigFileUpload';
import {
    CREATE_BIG_ATTACHMENT,
    MARK_ATTACHMENT_FILE_AS_UPLOADED,
} from './queries';

export type AttachmentResult = NonNullable<NonNullable<MarkAttachmentFileAsUploadedMutation['markBigAttachmentFileAsUploaded']>['result']>;

export default function useBigFileUploader(
    onComplete: (result: AttachmentResult) => void,
) {
    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const currentFileRef = useRef<File | undefined | null>(null);
    const xhrRef = useRef<XMLHttpRequest | null>(null);
    const [fileUploadProgress, setFileUploadProgress] = useState(0);
    const [fileUploading, setFileUploading] = useState(false);

    const handleUploadStart = useCallback((file: File) => {
        xhrRef.current = null;
        currentFileRef.current = file;
        setFileUploading(true);
        setFileUploadProgress(0);
    }, []);

    const handleUploadError = useCallback((notifyCallback?: () => void) => {
        if (isNotDefined(notifyCallback)) {
            notify({
                children: 'Some error occured during file upload.',
                variant: 'error',
            });
        } else {
            notifyCallback();
        }
        setFileUploading(false);
        setFileUploadProgress(0);
        currentFileRef.current = null;
        xhrRef.current = null;
    }, [notify]);

    const handleUploadComplete = useCallback(() => {
        notify({
            children: 'File uploaded successfully!',
            variant: 'success',
        });
        setFileUploading(false);
        setFileUploadProgress(0);
        currentFileRef.current = null;
        xhrRef.current = null;
    }, [
        notify,
    ]);

    const [
        markAttachmentFileAsUploaded,
        { loading: markAttachmentFileAsUploadedLoading },
    ] = useMutation<
        MarkAttachmentFileAsUploadedMutation,
        MarkAttachmentFileAsUploadedMutationVariables
    >(
        MARK_ATTACHMENT_FILE_AS_UPLOADED,
        {
            onCompleted: (response) => {
                const { markBigAttachmentFileAsUploaded } = response;
                if (!markBigAttachmentFileAsUploaded) {
                    handleUploadError();
                    return;
                }
                const {
                    errors,
                    ok,
                    result,
                } = markBigAttachmentFileAsUploaded;

                if (errors) {
                    handleUploadError(
                        () => notifyGQLError(errors),
                    );
                }

                if (ok && result) {
                    onComplete(result);
                    handleUploadComplete();
                }
            },
            onError: (err) => {
                handleUploadError(
                    () => notify({
                        children: err.message,
                        variant: 'error',
                    }),
                );
            },
        },
    );

    const [
        createBigAttachment,
        { loading: createBigAttachmentLoading },
    ] = useMutation<CreateBigAttachmentMutation, CreateBigAttachmentMutationVariables>(
        CREATE_BIG_ATTACHMENT,
        {
            onCompleted: (response) => {
                const { createBigAttachment: createBigAttachmentRes } = response;
                if (!createBigAttachmentRes) {
                    handleUploadError();
                    return;
                }

                const { ok, errors, result } = createBigAttachmentRes;

                if (errors) {
                    handleUploadError(
                        () => notifyGQLError(errors),
                    );
                    return;
                }

                if (!ok || !result) {
                    handleUploadError();
                    return;
                }
                const presignedUrl = createBigAttachmentRes.s3PresignedUploadUrl;

                if (isNotDefined(presignedUrl)) {
                    handleUploadError();
                    console.error('Presigned URL undefined.');
                    return;
                }
                if (isNotDefined(currentFileRef.current)) {
                    handleUploadError();
                    console.error('Attachment file not found');
                    return;
                }

                xhrRef.current = uploadFileUsingXhr({
                    file: currentFileRef.current,
                    url: presignedUrl,
                    onProgress: setFileUploadProgress,
                    onComplete: () => {
                        markAttachmentFileAsUploaded({
                            variables: {
                                attachmentId: result?.id,
                            },
                        });
                    },
                    onError: (error) => handleUploadError(
                        () => notify({
                            children: error,
                            variant: 'error',
                        }),
                    ),
                    onAbort: () => handleUploadError(
                        () => notify({
                            children: 'File upload aborted',
                            variant: 'error',
                        }),
                    ),
                });
            },
            onError: (error) => handleUploadError(
                () => notify({ children: error.message, variant: 'error' }),
            ),
        },
    );

    const startUpload = useCallback((file: File) => {
        handleUploadStart(file);

        createBigAttachment({
            variables: {
                fileName: file.name,
                // TODO: Need to handle cases when filetype is undefined
                mimeType: file.type,
            },
        });
    }, [
        handleUploadStart,
        createBigAttachment,
    ]);

    // NOTE: Aborting the upload request if component unmounts
    useEffect(() => {
        const abortXhr = () => {
            const xhr = xhrRef.current;
            if (!xhr) {
                return;
            }
            if (xhr.readyState !== XMLHttpRequest.DONE) {
                xhr.abort();
            }
        };
        return abortXhr;
    }, []);

    return {
        startUpload,
        progress: fileUploadProgress,
        uploading: fileUploading
            || markAttachmentFileAsUploadedLoading
            || createBigAttachmentLoading,
    };
}
