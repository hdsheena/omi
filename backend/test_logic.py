import sys
import os

def test_iterative_logic():
    class MockDoc:
        def __init__(self, d):
            self.d = d
        def to_dict(self):
            return self.d

    class MockQuery:
        def __init__(self, data, offset=0, limit=100):
            self.data = data
            self.o = offset
            self.l = limit
        def offset(self, o):
            return MockQuery(self.data, o, self.l)
        def limit(self, l):
            return MockQuery(self.data, self.o, l)
        def stream(self):
            return [MockDoc(d) for d in self.data[self.o : self.o + self.l]]

    # Generate 500 documents. Every 3rd is False
    all_data = []
    for i in range(500):
        if i % 3 == 0:
            all_data.append({'id': i, 'user_review': False})
        else:
            all_data.append({'id': i, 'user_review': True})

    # The expected output for limit=10, offset=10
    filtered_data = [d for d in all_data if d.get('user_review') is not False]
    expected = filtered_data[10:20]

    # Iterative logic
    memories_ref = MockQuery(all_data)
    limit = 10
    offset = 10
    result = []
    current_offset = 0
    chunk_size = 50

    while len(result) < offset + limit:
        query = memories_ref.limit(chunk_size).offset(current_offset)
        docs = [doc.to_dict() for doc in query.stream()]
        if not docs:
            break

        current_offset += len(docs)

        filtered = [doc for doc in docs if doc.get('user_review') is not False]
        result.extend(filtered)

    actual = result[offset : offset + limit]

    assert expected == actual, f"Expected {expected}, got {actual}"
    print("Success")

test_iterative_logic()
