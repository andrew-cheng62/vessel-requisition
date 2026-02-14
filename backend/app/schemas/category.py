# schemas/category.py
from pydantic import BaseModel

class CategoryOut(BaseModel):
    id: int
    name: str

    model_config = {
        "from_attributes": True
   }
