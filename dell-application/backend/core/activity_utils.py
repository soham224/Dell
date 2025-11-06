from sqlalchemy.orm import Session

import crud


def insert_login_success_log(user, db: Session) -> None:
    """Insert an activity log entry for a successful login event.

    Admin and Supervisor roles are logged with specific titles for clarity.
    """
    if crud.user.is_admin(user):
        crud.activity_crud_obj.insert_activity_data(
            db=db,
            activity_type="USER_LOGIN",
            title="Admin Login Success",
            description=f"Admin user ' {user.user_email} ' logged in successfully",
        )
    elif crud.user.is_supervisor(user):
        crud.activity_crud_obj.insert_activity_data(
            db=db,
            activity_type="USER_LOGIN",
            title="Supervisor Login Success",
            description=f"Supervisor user ' {user.user_email} ' logged in successfully",
        )


def insert_login_failed_log(user_email: str, db: Session) -> None:
    """Insert an activity log entry for a failed login attempt."""
    crud.activity_crud_obj.insert_activity_data(
        db=db,
        activity_type="USER_LOGIN",
        title="Login Failed",
        description=f"Failed login attempt for user '{user_email}'",
    )


def insert_inactive_user_log(user_email: str, db: Session) -> None:
    """Insert an activity log entry for an inactive user login attempt."""
    crud.activity_crud_obj.insert_activity_data(
        db=db,
        activity_type="USER_LOGIN",
        title="Login Failed",
        description=f"Login attempt failed for inactive user '{user_email}'",
    )
