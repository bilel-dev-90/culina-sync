// features/imageUpload.js

const CLOUDINARY_CONFIG = {
    URL: 'https://api.cloudinary.com/v1_1/djwp0ond5/image/upload',
    UPLOAD_PRESET: 'culina_sync_unsigned'
};

/**
 * Lädt eine Bilddatei zu Cloudinary hoch.
 * @param {File} file - Die vom Nutzer ausgewählte Bilddatei.
 * @returns {Promise<string>} Die sichere URL des hochgeladenen Bildes.
 */
export async function uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_CONFIG.URL, {
        method: 'POST',
        body: formData
    });
    
    const data = await response.json();
    if (data.error) {
        throw new Error(`Cloudinary Upload Error: ${data.error.message}`);
    }
    return data.secure_url;
}