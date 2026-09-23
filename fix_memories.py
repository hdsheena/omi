import re

with open("backend/database/memories.py", "r") as f:
    code = f.read()

new_func = """@prepare_for_read(decrypt_func=_prepare_memory_for_read)
def get_memories(
    uid: str,
    limit: int = 100,
    offset: int = 0,
    categories: List[str] = [],
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
):
    logger.info(f'get_memories db {uid} {limit} {offset} {categories} {start_date} {end_date}')
    memories_ref = db.collection(users_collection).document(uid).collection(memories_collection)

    if categories:
        memories_ref = memories_ref.where(filter=FieldFilter('category', 'in', categories))

    if start_date:
        memories_ref = memories_ref.where(filter=FieldFilter('created_at', '>=', start_date))

    if end_date:
        memories_ref = memories_ref.where(filter=FieldFilter('created_at', '<=', end_date))

    memories_ref = (
        memories_ref.order_by('scoring', direction=firestore.Query.DESCENDING)
        .order_by('created_at', direction=firestore.Query.DESCENDING)
    )

    # We must fetch iteratively because we filter out rejected memories (user_review == False) in Python.
    # If we apply .limit() and .offset() directly to the Firestore query, we might skip valid
    # memories or return fewer than 'limit' memories if some were rejected.

    result = []
    current_offset = 0
    # Fetch in chunks to avoid pulling all memories into memory.
    chunk_size = max(50, limit * 2 if limit else 100)

    while len(result) < offset + limit:
        query = memories_ref.limit(chunk_size).offset(current_offset)
        docs = [doc.to_dict() for doc in query.stream()]

        if not docs:
            break

        current_offset += len(docs)

        # Filter out rejected memories
        filtered = [doc for doc in docs if doc.get('user_review') is not False]
        result.extend(filtered)

    logger.info(f"get_memories returned {min(limit, len(result) - offset)} valid memories out of requested limit {limit}")
    return result[offset : offset + limit]
"""

old_func = """@prepare_for_read(decrypt_func=_prepare_memory_for_read)
def get_memories(
    uid: str,
    limit: int = 100,
    offset: int = 0,
    categories: List[str] = [],
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
):
    logger.info(f'get_memories db {uid} {limit} {offset} {categories} {start_date} {end_date}')
    memories_ref = db.collection(users_collection).document(uid).collection(memories_collection)

    if categories:
        memories_ref = memories_ref.where(filter=FieldFilter('category', 'in', categories))

    if start_date:
        memories_ref = memories_ref.where(filter=FieldFilter('created_at', '>=', start_date))

    if end_date:
        memories_ref = memories_ref.where(filter=FieldFilter('created_at', '<=', end_date))

    memories_ref = (
        memories_ref.order_by('scoring', direction=firestore.Query.DESCENDING)
        .order_by('created_at', direction=firestore.Query.DESCENDING)
        .limit(limit)
        .offset(offset)
    )

    # TODO: put user review to firestore query
    memories = [doc.to_dict() for doc in memories_ref.stream()]
    logger.info(f"get_memories {len(memories)}")
    result = [memory for memory in memories if memory.get('user_review') is not False]
    return result
"""

code = code.replace(old_func, new_func)

with open("backend/database/memories.py", "w") as f:
    f.write(code)
