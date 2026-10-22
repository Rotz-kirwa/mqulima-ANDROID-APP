from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator

Publication = Literal["draft", "published", "archived"]


class CleanModel(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="ignore")


class Variant(CleanModel):
    label: str = Field(min_length=1, max_length=60)
    price: float = Field(ge=0, le=100000000, allow_inf_nan=False)


class ProductIn(CleanModel):
    name: str = Field(min_length=2, max_length=180)
    category: str = Field(min_length=1, max_length=80)
    price: float = Field(ge=0, le=100000000, allow_inf_nan=False)
    stock: int = Field(ge=0, le=1000000)
    description: str = Field(min_length=5, max_length=10000)
    image: str = Field(default="", max_length=2000)
    featured: bool = False
    variants: list[Variant] = Field(default_factory=list, max_length=40)
    status: Publication = "draft"

    @field_validator("variants")
    @classmethod
    def unique_variants(cls, values):
        if len({v.label.casefold() for v in values}) != len(values):
            raise ValueError("Variant labels must be unique")
        return values


class ArticleIn(CleanModel):
    title: str = Field(min_length=3, max_length=220)
    excerpt: str = Field(min_length=5, max_length=1000)
    category: str = Field(min_length=1, max_length=80)
    group: str = Field(min_length=1, max_length=80)
    readTime: str = Field(default="3 min read", max_length=40)
    date: str = Field(default="", max_length=60)
    image: str = Field(default="", max_length=2000)
    body: list[str] = Field(min_length=1, max_length=100)
    featured: bool = False
    status: Publication = "draft"

    @field_validator("body")
    @classmethod
    def body_not_empty(cls, values):
        clean = [v.strip() for v in values if v.strip()]
        if not clean or sum(map(len, clean)) > 100000:
            raise ValueError("Write article content (maximum 100,000 characters)")
        return clean


class ServiceCategoryIn(CleanModel):
    title: str = Field(min_length=2, max_length=120)
    text: str = Field(min_length=5, max_length=4000)
    n: str = Field(default="01", max_length=10)
    image: str = Field(default="", max_length=2000)
    cta: str = Field(default="View Services", max_length=60)
    status: Publication = "draft"


class Step(CleanModel):
    title: str = Field(min_length=1, max_length=160)
    text: str = Field(min_length=1, max_length=2000)


class ServiceIn(CleanModel):
    title: str = Field(min_length=2, max_length=150)
    category_id: str = Field(min_length=1, max_length=120)
    text: str = Field(min_length=5, max_length=5000)
    price: str = Field(min_length=1, max_length=180)
    tag: str = Field(default="On Request", max_length=60)
    numeral: str = Field(default="I", max_length=10)
    cta: str = Field(default="Request service", max_length=60)
    image: str = Field(default="", max_length=2000)
    steps: list[Step] = Field(default_factory=list, max_length=12)
    includes: list[str] = Field(default_factory=list, max_length=20)
    status: Publication = "draft"


class LessonIn(CleanModel):
    title: str = Field(min_length=1, max_length=180)
    duration: str = Field(default="5 min", max_length=40)
    preview: bool = False
    summary: str = Field(default="", max_length=12000)
    points: list[str] = Field(default_factory=list, max_length=30)


class ModuleIn(CleanModel):
    title: str = Field(min_length=1, max_length=180)
    lessons: list[LessonIn] = Field(default_factory=list, max_length=50)


class CourseIn(CleanModel):
    title: str = Field(min_length=2, max_length=180)
    n: str = Field(default="01", max_length=10)
    level: str = Field(default="Beginner", max_length=50)
    duration: str = Field(default="Self paced", max_length=80)
    text: str = Field(min_length=5, max_length=5000)
    image: str = Field(default="", max_length=2000)
    outcomes: list[str] = Field(default_factory=list, max_length=30)
    modules: list[ModuleIn] = Field(default_factory=list, max_length=30)
    status: Publication = "draft"


class StatusIn(CleanModel):
    status: str = Field(max_length=40)
    notes: str = Field(default="", max_length=4000)
    assigned_to: str = Field(default="", max_length=120)
    specialist_contact: str = Field(default="", max_length=120)
    payment_status: str = Field(default="", max_length=30)
    payment_reference: str = Field(default="", max_length=100)


class ModerationIn(CleanModel):
    hidden: bool
    reason: str = Field(min_length=3, max_length=500)


class AdminList(BaseModel):
    items: list[dict]
    total: int
    page: int
    pages: int


class AdminRecord(BaseModel):
    item: dict