import hashlib

def hash_email_to_username(email):
  h = hashlib.md5()
  h.update(email)
  return h.hexdigest()[0:30]