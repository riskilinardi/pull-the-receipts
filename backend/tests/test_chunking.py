from rag.chunking import chunk_text


def test_short_text_is_single_chunk():
    chunks = chunk_text("First sentence. Second sentence.", chunk_size=1000)
    assert len(chunks) == 1
    assert chunks[0].index == 0


def test_chunks_respect_size_budget():
    text = " ".join(f"Sentence number {i} with a few words." for i in range(200))
    chunks = chunk_text(text, chunk_size=300, overlap=50)
    assert len(chunks) > 1
    assert all(len(chunk.text) <= 300 + 50 for chunk in chunks)


def test_consecutive_chunks_overlap():
    text = " ".join(f"Sentence {i}." for i in range(100))
    chunks = chunk_text(text, chunk_size=200, overlap=60)
    overlap_token = chunks[0].text.split()[-1]
    assert overlap_token in chunks[1].text


def test_unpunctuated_run_is_hard_wrapped():
    chunks = chunk_text("x" * 2500, chunk_size=500)
    assert len(chunks) >= 5
    assert all(len(chunk.text) <= 500 for chunk in chunks)


def test_whitespace_only_returns_no_chunks():
    assert chunk_text("   ") == []