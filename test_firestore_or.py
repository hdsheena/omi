# The OR query would be:
# user_review == True OR user_review == None OR user_review does not exist?
# Wait, Firestore does not have an "exists" operator or "does not exist" in the query API!
# You can do `FieldFilter('user_review', '==', None)` but it only matches documents where the field is explicitly set to `null`.
# Documents where the field is missing will NOT be matched by `== None`!
