# schemas/category.py
from pydantic import BaseModel

class CategoryOut(BaseModel):
    id: int
    name: str
    is_active: bool = True

    model_config = {
        "from_attributes": True
   }
