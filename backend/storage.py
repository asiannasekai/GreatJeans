"""Ephemeral storage helpers for uploaded files.

Files are written beneath ./storage/tmp/<upload_id>/
No persistence guarantees; DELETE removes directories.
"""
from __future__ import annotations
import os, shutil, uuid
from pathlib import Path
from typing import Optional
from .config import STORAGE_ROOT, MAX_UPLOAD_MB

BASE_DIR = STORAGE_ROOT
BASE_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_EXT = {'.txt', '.vcf', '.gz'}  # .vcf.gz supported


def new_upload_id() -> str:
    return uuid.uuid4().hex


def upload_dir(upload_id: str) -> Path:
    return BASE_DIR / upload_id


def input_path(upload_id: str) -> Path:
    return upload_dir(upload_id) / 'input'


def save_upload(file_bytes: bytes, filename: str) -> str:
    ext = ''.join(Path(filename).suffixes[-2:]) if filename.endswith('.vcf.gz') else Path(filename).suffix
    if ext not in ALLOWED_EXT and not filename.endswith('.vcf.gz'):
        raise ValueError('unsupported_file_type')
    if len(file_bytes) > MAX_UPLOAD_MB * 1024 * 1024:
        raise MemoryError('file_too_large')
    uid = new_upload_id()
    d = upload_dir(uid)
    d.mkdir(parents=True, exist_ok=True)
    with open(input_path(uid), 'wb') as f:
        f.write(file_bytes)
    return uid


def load_upload_bytes(upload_id: str) -> bytes:
    p = input_path(upload_id)
    if not p.exists():
        raise FileNotFoundError('upload_not_found')
    return p.read_bytes()


def delete_upload(upload_id: str) -> bool:
    d = upload_dir(upload_id)
    if d.exists():
        shutil.rmtree(d, ignore_errors=True)
        return True
    return False
