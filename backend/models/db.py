from pymongo import MongoClient
import os

client = MongoClient(os.getenv("MONGODB_ATLAS_URI"))
db = client["textify_db"]

users_collection = db["users"]
documents_collection = db["documents"]
