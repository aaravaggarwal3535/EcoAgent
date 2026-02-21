import socketio

# Create a Socket.IO server with ASGI async mode
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

# Wrap with ASGI application
socket_app = socketio.ASGIApp(sio)

@sio.event
async def connect(sid, environ, auth):
    print(f"[SOCKET] Client connected: {sid}")
    # Allow joining a room based on session token if provided in query or auth
    query_string = environ.get('QUERY_STRING', '')
    if 'session=' in query_string:
        session_token = query_string.split('session=')[1].split('&')[0]
        await sio.enter_room(sid, session_token)
        print(f"[SOCKET] Client {sid} joined room: {session_token}")
        
@sio.event
async def join_room_event(sid, data):
    session_token = data.get('session')
    if session_token:
        await sio.enter_room(sid, session_token)
        print(f"[SOCKET] Client {sid} manually joined room: {session_token}")
        # Acknowledge connection
        await sio.emit('connection_status', {'status': 'connected'}, room=session_token)

@sio.event
async def disconnect(sid):
    print(f"[SOCKET] Client disconnected: {sid}")
