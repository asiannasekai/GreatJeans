from fastapi.testclient import TestClient
from backend.api import app
from pathlib import Path

client = TestClient(app)

def test_upload_and_analyze_23andme():
    sample_path = Path('backend/data/demo/sample_23andme.txt')
    with open(sample_path,'rb') as f:
        resp = client.post('/upload', files={'file': ('sample_23andme.txt', f, 'text/plain')})
    assert resp.status_code==200
    upload_id = resp.json()['upload_id']
    ar = client.post('/analyze', json={'upload_id': upload_id, 'run_traits': True, 'run_protein': True, 'run_pgs': True})
    assert ar.status_code==200, ar.text
    data = ar.json()
    assert data['qc']['format']=='23andme'
    # Trait coverage
    lactose = [t for t in data['traits'] if t['rsid']=='rs4988235'][0]
    assert lactose['status']=='covered'
    # Protein mapping
    assert data['protein']['uniprot']=='P04637'


def test_delete_flow():
    sample_path = Path('backend/data/demo/sample_23andme.txt')
    with open(sample_path,'rb') as f:
        resp = client.post('/upload', files={'file': ('sample_23andme.txt', f, 'text/plain')})
    upload_id = resp.json()['upload_id']
    del1 = client.delete(f'/uploads/{upload_id}')
    assert del1.status_code==200
    del2 = client.delete(f'/uploads/{upload_id}')
    assert del2.status_code==200


def test_error_oversize():
    big_bytes = b'A'* (21*1024*1024)
    resp = client.post('/upload', files={'file': ('big.txt', big_bytes, 'text/plain')})
    assert resp.status_code==413


def test_health():
    r = client.get('/health')
    assert r.status_code == 200
    assert r.json() == {"ok": True}
