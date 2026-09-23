# If we change pagination to fetch more documents, we could do something like this in `get_memories`:
"""
    result = []
    # If we apply filter in memory, we need to iterate until we get `limit` items, or no more documents.
    # To do that, we can use `offset` for the FIRST fetch. But subsequent fetches need to continue from the last offset.
    # Actually, the user asked to "put user review to firestore query".
    # Let's read what the TODO says exactly: "# TODO: put user review to firestore query"
"""
print("OK")
