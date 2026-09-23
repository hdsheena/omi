import pytest
from unittest.mock import MagicMock, patch
from backend.database.memories import get_memories

@patch('backend.database.memories.db')
def test_get_memories_iterative(mock_db):
    pass
