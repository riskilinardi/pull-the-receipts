from pydantic import BaseModel, ConfigDict, Field


class AskRequest(BaseModel):
    question: str = Field(min_length=1)


class IngestResponse(BaseModel):
    filename: str
    chunks_added: int


class SourceModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    number: int
    text: str
    source: str
    page: int | None
    score: float

class DocumentInfo(BaseModel):
    filename: str
    chunks: int