"""SQLAlchemy ORM models."""
from sqlalchemy import Column, String, Integer, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import uuid, datetime

def new_id(): return uuid.uuid4().hex
def now_utc(): return datetime.datetime.utcnow().isoformat()

class Project(Base):
    __tablename__ = "projects"
    id         = Column(String, primary_key=True, default=new_id)
    name       = Column(String, nullable=False)
    path       = Column(String, nullable=False)
    settings   = Column(Text, nullable=False, default="{}")
    is_active  = Column(Integer, nullable=False, default=0)
    created_at = Column(String, nullable=False, default=now_utc)
    updated_at = Column(String, nullable=False, default=now_utc)
    conversations = relationship("Conversation", back_populates="project")

class ModelAccount(Base):
    __tablename__ = "model_accounts"
    id                  = Column(String, primary_key=True, default=new_id)
    provider            = Column(String, nullable=False)
    account_label       = Column(String, nullable=False)
    api_key_encrypted   = Column(Text, nullable=False)
    base_url            = Column(String)
    is_active           = Column(Integer, nullable=False, default=1)
    priority            = Column(Integer, nullable=False, default=0)
    token_limit_per_day = Column(Integer, nullable=False, default=0)
    tokens_used_today   = Column(Integer, nullable=False, default=0)
    last_used_at        = Column(String)
    last_reset_at       = Column(String, nullable=False, default=now_utc)
    created_at          = Column(String, nullable=False, default=now_utc)

class ModelConfig(Base):
    __tablename__ = "model_configs"
    id             = Column(String, primary_key=True, default=new_id)
    display_name   = Column(String, nullable=False)
    provider       = Column(String, nullable=False)
    model_id       = Column(String, nullable=False)
    context_window = Column(Integer, nullable=False, default=128000)
    is_enabled     = Column(Integer, nullable=False, default=1)
    sort_order     = Column(Integer, nullable=False, default=0)
    created_at     = Column(String, nullable=False, default=now_utc)

class Conversation(Base):
    __tablename__ = "conversations"
    id              = Column(String, primary_key=True, default=new_id)
    project_id      = Column(String, ForeignKey("projects.id", ondelete="SET NULL"))
    title           = Column(String, nullable=False, default="New Conversation")
    model_config_id = Column(String, ForeignKey("model_configs.id", ondelete="SET NULL"))
    goal            = Column(Text)
    memory_summary  = Column(Text)          # Compressed memory: JSON with goal, completed, current_state, key_decisions, pending
    memory_turn_count = Column(Integer, nullable=False, default=0)  # Last message count when memory was updated
    status          = Column(String, nullable=False, default="active")
    token_count     = Column(Integer, nullable=False, default=0)
    is_pinned       = Column(Integer, nullable=False, default=0)
    created_at      = Column(String, nullable=False, default=now_utc)
    updated_at      = Column(String, nullable=False, default=now_utc)
    project      = relationship("Project", back_populates="conversations")
    messages     = relationship("Message", back_populates="conversation", cascade="all, delete")
    checkpoints  = relationship("Checkpoint", back_populates="conversation", cascade="all, delete")
    artifacts    = relationship("Artifact", back_populates="conversation", cascade="all, delete")
    subagents    = relationship("Subagent", back_populates="conversation", cascade="all, delete")

class Message(Base):
    __tablename__ = "messages"
    id               = Column(String, primary_key=True, default=new_id)
    conversation_id  = Column(String, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role             = Column(String, nullable=False)   # user|assistant|tool|system
    content          = Column(Text, nullable=False)
    model_account_id = Column(String, ForeignKey("model_accounts.id", ondelete="SET NULL"))
    model_id         = Column(String)
    token_count      = Column(Integer, nullable=False, default=0)
    sequence_index   = Column(Integer, nullable=False)
    created_at       = Column(String, nullable=False, default=now_utc)
    conversation = relationship("Conversation", back_populates="messages")
    tool_calls   = relationship("ToolCall", back_populates="message", cascade="all, delete")

class ToolCall(Base):
    __tablename__ = "tool_calls"
    id             = Column(String, primary_key=True, default=new_id)
    message_id     = Column(String, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    tool_name      = Column(String, nullable=False)
    arguments      = Column(Text, nullable=False, default="{}")
    result         = Column(Text)
    status         = Column(String, nullable=False, default="pending")
    approved_by_user = Column(Integer, nullable=False, default=0)
    error_message  = Column(Text)
    started_at     = Column(String)
    completed_at   = Column(String)
    created_at     = Column(String, nullable=False, default=now_utc)
    message = relationship("Message", back_populates="tool_calls")

class Artifact(Base):
    __tablename__ = "artifacts"
    id              = Column(String, primary_key=True, default=new_id)
    conversation_id = Column(String, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    type            = Column(String, nullable=False)
    title           = Column(String, nullable=False, default="Artifact")
    content         = Column(Text, nullable=False)
    version         = Column(Integer, nullable=False, default=1)
    created_at      = Column(String, nullable=False, default=now_utc)
    updated_at      = Column(String, nullable=False, default=now_utc)
    conversation = relationship("Conversation", back_populates="artifacts")

class Checkpoint(Base):
    __tablename__ = "checkpoints"
    id                 = Column(String, primary_key=True, default=new_id)
    conversation_id    = Column(String, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    message_index      = Column(Integer, nullable=False)
    goal_snapshot      = Column(Text, nullable=False)
    progress_summary   = Column(Text, nullable=False)
    context_snapshot   = Column(Text, nullable=False)   # JSON messages array
    pending_tool_calls = Column(Text, nullable=False, default="[]")
    model_id_at_stop   = Column(String)
    stop_reason        = Column(String, nullable=False, default="token_limit")
    is_resumed         = Column(Integer, nullable=False, default=0)
    resumed_at         = Column(String)
    created_at         = Column(String, nullable=False, default=now_utc)
    conversation = relationship("Conversation", back_populates="checkpoints")

class Setting(Base):
    __tablename__ = "settings"
    key        = Column(String, primary_key=True)
    value      = Column(Text, nullable=False)
    updated_at = Column(String, nullable=False, default=now_utc)

class PermissionRule(Base):
    __tablename__ = "permission_rules"
    id         = Column(String, primary_key=True, default=new_id)
    scope      = Column(String, nullable=False)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"))
    type       = Column(String, nullable=False)
    pattern    = Column(String, nullable=False)
    action     = Column(String, nullable=False)
    created_at = Column(String, nullable=False, default=now_utc)

class ScheduledTask(Base):
    __tablename__ = "scheduled_tasks"
    id                    = Column(String, primary_key=True, default=new_id)
    project_id            = Column(String, ForeignKey("projects.id", ondelete="SET NULL"))
    name                  = Column(String, nullable=False)
    cron_expression       = Column(String)
    delay_seconds         = Column(Integer)
    conversation_template = Column(Text, nullable=False, default="{}")
    status                = Column(String, nullable=False, default="active")
    last_run_at           = Column(String)
    next_run_at           = Column(String)
    last_error            = Column(Text)
    created_at            = Column(String, nullable=False, default=now_utc)

class Skill(Base):
    __tablename__ = "skills"
    id          = Column(String, primary_key=True, default=new_id)
    name        = Column(String, nullable=False)
    source      = Column(String, nullable=False)
    folder_path = Column(String)
    enabled     = Column(Integer, nullable=False, default=1)
    config      = Column(Text, nullable=False, default="{}")
    created_at  = Column(String, nullable=False, default=now_utc)

class Subagent(Base):
    __tablename__ = "subagents"
    id              = Column(String, primary_key=True, default=new_id)
    parent_conv_id  = Column(String, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    name            = Column(String, nullable=False)
    model_config_id = Column(String, ForeignKey("model_configs.id", ondelete="SET NULL"))
    status          = Column(String, nullable=False, default="running")
    brief           = Column(Text, nullable=False)
    result          = Column(Text)
    started_at      = Column(String, nullable=False, default=now_utc)
    completed_at    = Column(String)
    conversation = relationship("Conversation", back_populates="subagents")
