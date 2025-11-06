from pydantic import BaseModel


class UseCaseCreate(BaseModel):
    usecase: str


class UseCaseUpdate(UseCaseCreate):
    id: int


class UseCaseSchema(BaseModel):
    id: int
    usecase: str

    class Config:
        orm_mode = True
