import { v2 as cloudinary } from 'cloudinary';

// Cloudinary configuration
const CLOUD_NAME = 'your-cloud-name'; // Replace with your Cloudinary cloud name
const UPLOAD_PRESET = 'your-upload-preset'; // Replace with your unsigned upload preset

/**
 * Upload an image or video to Cloudinary
 * @param fileUri - The local file URI to upload
 * @param resourceType - Type of resource ('image' or 'video')
 * @returns Promise<string> - The secure URL of the uploaded media
 */
export const uploadToCloudinary = async (
  fileUri: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<string> => {
  try {
    // Create form data for the upload
    const formData = new FormData();
    
    // Add the file to form data
    formData.append('file', {
      uri: fileUri,
      type: resourceType === 'image' ? 'image/jpeg' : 'video/mp4',
      name: `upload.${resourceType === 'image' ? 'jpg' : 'mp4'}`,
    } as any);
    
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('cloud_name', CLOUD_NAME);
    
    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(`Cloudinary error: ${result.error.message}`);
    }
    
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

/**
 * Upload multiple files to Cloudinary
 * @param fileUris - Array of local file URIs to upload
 * @param resourceType - Type of resource ('image' or 'video')
 * @returns Promise<string[]> - Array of secure URLs of the uploaded media
 */
export const uploadMultipleToCloudinary = async (
  fileUris: string[],
  resourceType: 'image' | 'video' = 'image'
): Promise<string[]> => {
  try {
    const uploadPromises = fileUris.map(uri => 
      uploadToCloudinary(uri, resourceType)
    );
    
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple files to Cloudinary:', error);
    throw error;
  }
};

/**
 * Get optimized image URL from Cloudinary
 * @param publicId - The public ID of the image in Cloudinary
 * @param transformations - Optional transformations to apply
 * @returns string - The optimized image URL
 */
export const getOptimizedImageUrl = (
  publicId: string,
  transformations?: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
    crop?: 'fill' | 'fit' | 'scale' | 'crop';
  }
): string => {
  let transformString = '';
  
  if (transformations) {
    const transforms = [];
    
    if (transformations.width) transforms.push(`w_${transformations.width}`);
    if (transformations.height) transforms.push(`h_${transformations.height}`);
    if (transformations.quality) transforms.push(`q_${transformations.quality}`);
    if (transformations.format) transforms.push(`f_${transformations.format}`);
    if (transformations.crop) transforms.push(`c_${transformations.crop}`);
    
    if (transforms.length > 0) {
      transformString = `/${transforms.join(',')}`;
    }
  }
  
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload${transformString}/${publicId}`;
};