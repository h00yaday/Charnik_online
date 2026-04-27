import asyncio

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType

from core.celery_app import celery_app
from core.config import settings

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)


async def send_welcome_email_async(email: str, username: str):
    html = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <h2>Привет, {username}! Добро пожаловать в Charnik Online!</h2>
            <p>Мы очень рады, что ты присоединился к нам.</p>
            <p>Теперь ты можешь создавать персонажей, бросать кубики и участвовать в кампаниях.</p>
            <br>
            <p>Удачных критических бросков!</p>
        </body>
    </html>
    """

    message = MessageSchema(
        subject="Добро пожаловать в Charnik Online!", recipients=[email], body=html, subtype=MessageType.html
    )

    fm = FastMail(conf)
    await fm.send_message(message)


@celery_app.task
def send_welcome_email(email: str, username: str):
    asyncio.run(send_welcome_email_async(email, username))
