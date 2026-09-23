# Could we do this logic:
# `memories_ref = memories_ref.limit(limit * 2 + offset * 2)`
# Basically fetch more than we need, then slice. That's still a hack.

# Or, what if we use an iterative fetch where we fetch by chunks, filter them, until we get `offset + limit` items, and then return the last `limit` items?
# For example:
"""
current_offset = 0
chunk_size = limit * 2 # To account for some filtered out
filtered_memories = []

while len(filtered_memories) < offset + limit:
    query = base_query.offset(current_offset).limit(chunk_size)
    docs = [doc.to_dict() for doc in query.stream()]
    if not docs:
        break
    current_offset += len(docs)

    for doc in docs:
        if doc.get('user_review') is not False:
            filtered_memories.append(doc)

return filtered_memories[offset:offset+limit]
"""
# This guarantees we fetch exactly what's needed without loading everything if offset is small.
# But wait, if offset is large (like 1000), we fetch chunk_size iteratively until 1000+limit.
# That is slightly slower than a direct `.offset(1000)` but it is CORRECT!
