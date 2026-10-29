"""Compatibility entry point for the 320-problem, five-case verifier."""
from pathlib import Path
import runpy
if __name__=='__main__':
    runpy.run_path(str(Path(__file__).with_name('verify_dataset_v6.py')),run_name='__main__')
