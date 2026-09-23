# The rust code does:
# .filter(|m| m.user_review != Some(false))
# IN MEMORY. (It's part of an iterator `.filter()`).
# So Rust doesn't do it in Firestore either.

# Wait, if we CANNOT do it in Firestore because of `null`/missing fields, then how do we fix it?
# In Firestore, we could use a compound query if we populate a field, but we can't change all existing documents easily.
# Alternatively, maybe `user_review` can be queried if we just use `!= False` and accept that older ones don't match? No, that breaks old memories.
# What if we just fetch more in Python until we reach the limit?
# Actually, wait, is there a way to do `OR` queries in Firestore now?
# Yes! `google.cloud.firestore_v1.base_query.Or`
