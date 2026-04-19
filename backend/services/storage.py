import cloudinary
import cloudinary.uploader
import os

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)


def upload_file(file_bytes: bytes, filename: str, folder: str = "textify") -> dict:
    """Upload file to Cloudinary"""
    try:
        result = cloudinary.uploader.upload(
            file_bytes,
            folder=folder,
            public_id=filename,
            resource_type="auto",
        )
        return {"success": True, "url": result["secure_url"], "public_id": result["public_id"]}
    except Exception as e:
        return {"success": False, "error": str(e)}


def delete_file(public_id: str) -> bool:
    try:
        cloudinary.uploader.destroy(public_id)
        return True
    except:
        return False
