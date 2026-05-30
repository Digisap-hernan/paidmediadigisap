"""Vercel serverless entry point.

Vercel's @vercel/python runtime detects FastAPI (ASGI) apps when the variable
`app` is exported. This file simply re-exports the main FastAPI app.
"""
import os
import sys

# Make the parent directory importable so `from app.main import app` works
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app  # noqa: E402  (re-exported as Vercel handler)
