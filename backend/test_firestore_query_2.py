# If we do push it to Firestore query:
# user_review NOT in [False] ?
# Firestore `not-in` filter is supported!
# `FieldFilter("user_review", "not-in", [False])`
# But does `not-in` match documents missing the field?
# Firestore documentation: "A not-in query returns documents where the given field exists and its value is not in the specified array."
# So `not-in` also excludes documents missing the field.
