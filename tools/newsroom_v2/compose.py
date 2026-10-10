"""Preserve existing R1 Gutenberg citations/reader modules in a bounded subprocess."""
import json,sys
from tools.newsroom.pipeline import attach_reader_modules
payload=json.load(sys.stdin)
print(attach_reader_modules(payload['markup'],payload['packet'],payload.get('faqs',[])),end='')
