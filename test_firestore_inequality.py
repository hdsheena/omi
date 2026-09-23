# If we do:
# memories_ref = memories_ref.where(filter=FieldFilter('user_review', '!=', False))
# This is what Firestore documentation says: "In a != query, documents in which the specified field doesn't exist aren't returned."
# Wait! Did the Rust backend do it in memory?
# Let's re-read the Rust code.
