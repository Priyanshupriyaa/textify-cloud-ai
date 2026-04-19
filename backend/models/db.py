from pymongo import MongoClient
import os

client = MongoClient(os.getenv("MONGO_URI"))
db = client["textify_db"]

users_collection = db["users"]
documents_collection = db["documents"]
