import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from google.cloud.firestore_v1.base_query import FieldFilter, Or

# We don't have credentials right now, but we can check the syntax.
# Actually we can't run against real firestore without a local emulator or credentials.
