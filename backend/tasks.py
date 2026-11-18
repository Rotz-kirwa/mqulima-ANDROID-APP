"""Tracked asyncio background task registry to prevent orphaned tasks and surface failures."""
import asyncio
import logging
from collections.abc import Coroutine
from typing import Any, Optional

logger = logging.getLogger(__name__)
background_tasks: set[asyncio.Task[Any]] = set()


def _on_task_done(task: asyncio.Task[Any]) -> None:
    background_tasks.discard(task)
    if task.cancelled():
        return
    exc = task.exception()
    if exc is not None:
        logger.error(
            "Background task %s failed: %s",
            task.get_name(),
            exc,
            exc_info=(type(exc), exc, exc.__traceback__),
        )


def create_background_task(coro: Coroutine[Any, Any, Any], *, name: Optional[str] = None) -> asyncio.Task[Any]:
    """Create and retain a strong reference to an asyncio task until it finishes."""
    task = asyncio.create_task(coro, name=name)
    background_tasks.add(task)
    task.add_done_callback(_on_task_done)
    return task


async def shutdown_background_tasks(timeout: float = 2.0) -> None:
    """Cancel or await any remaining background tasks during server shutdown."""
    pending = [t for t in background_tasks if not t.done()]
    if not pending:
        return
    done, still_pending = await asyncio.wait(pending, timeout=timeout)
    _ = done
    for task in still_pending:
        task.cancel()
    if still_pending:
        await asyncio.gather(*still_pending, return_exceptions=True)
