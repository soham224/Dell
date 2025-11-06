from sqlalchemy import Column, Integer, String

from db.base_class import Base


class UseCase(Base):
    __tablename__ = "usecase"
    id = Column(Integer, primary_key=True, index=True)
    usecase = Column(String(255), nullable=False)
