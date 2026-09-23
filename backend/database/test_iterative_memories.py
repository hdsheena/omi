import pytest
from unittest.mock import Mock, patch
from backend.database.memories import get_memories

@patch('backend.database.memories.db')
def test_get_memories(mock_db):
    pass
