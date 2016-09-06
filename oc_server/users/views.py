from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import IntegrityError
from users.utils import hash_email_to_username

@api_view(['POST'])
def create_user(req):
  try:
    email = req.data['email']
    username = hash_email_to_username(email)
    password = req.data['password']
  except KeyError:
    return Response({'detail': 'Request must include email and password.'}, status=status.HTTP_400_BAD_REQUEST)
  try:
    user = User.objects.create_user(username, email, password)
  except IntegrityError:
    return Response({'detail': 'User with that email already exists.'}, status=status.HTTP_400_BAD_REQUEST)
  return Response(status=status.HTTP_201_CREATED)

@api_view(['POST'])
def get_auth_token(req):
  try:
    email = req.data['email']
    username = hash_email_to_username(email)
    password = req.data['password']
  except KeyError:
    return Response({'detail': 'Request must include email and password.'}, status=status.HTTP_400_BAD_REQUEST)
  user = authenticate(username=username, password=password)
  if user is not None:
    if user.is_active:
      token, created = Token.objects.get_or_create(user=user)
      return Response({'token': token.key})
    else:
      return Response({'detail': 'User inactive.'}, status=status.HTTP_403_FORBIDDEN)
  return Response({'detail': 'Login incorrect.'}, status=status.HTTP_401_UNAUTHORIZED)