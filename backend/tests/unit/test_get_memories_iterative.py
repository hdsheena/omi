import pytest
import os
from unittest.mock import MagicMock, patch

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/dev/null'

with patch('google.cloud.firestore.Client'):
    from database.memories import get_memories

class MockDoc:
    def __init__(self, data):
        self._data = data

    def to_dict(self):
        return self._data

class MockQuery:
    def __init__(self, all_docs, offset_val=0, limit_val=0):
        self.all_docs = all_docs
        self.offset_val = offset_val
        self.limit_val = limit_val

    def offset(self, val):
        return MockQuery(self.all_docs, val, self.limit_val)

    def limit(self, val):
        return MockQuery(self.all_docs, self.offset_val, val)

    def stream(self):
        end = self.offset_val + self.limit_val if self.limit_val else len(self.all_docs)
        return self.all_docs[self.offset_val : end]

@patch('database.memories.db')
def test_get_memories_pagination(mock_db):
    all_data = []
    # 50 valid, 50 invalid, alternating
    for i in range(100):
        if i % 2 == 0:
            all_data.append(MockDoc({'id': str(i), 'user_review': True, 'data_protection_level': 'default'}))
        else:
            all_data.append(MockDoc({'id': str(i), 'user_review': False, 'data_protection_level': 'default'}))

    mock_collection = MagicMock()
    mock_db.collection.return_value.document.return_value.collection.return_value = mock_collection

    # We need to mock order_by
    mock_ordered = MockQuery(all_data)
    mock_collection.order_by.return_value.order_by.return_value = mock_ordered

    # Get offset=10, limit=10
    # The valid memories are those with even IDs: 0, 2, 4, ...
    # We want valid memories with index 10 to 19, which means IDs 20, 22, ..., 38

    result = get_memories("user123", limit=10, offset=10)

    assert len(result) == 10
    assert result[0]['id'] == '20'
    assert result[-1]['id'] == '38'
