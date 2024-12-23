import React from 'react';
import { useSelector } from "react-redux";
import { Layout, Button, Menu, Input, Badge, Avatar, Popover, Select, Modal } from "antd";
import { LogoutOutlined, SettingOutlined, SearchOutlined, MenuOutlined, SendOutlined, PaperClipOutlined, TeamOutlined, VideoCameraOutlined, PhoneOutlined, AudioOutlined, SmileOutlined, DeleteOutlined } from '@ant-design/icons'
import { useContext, useEffect, useRef, useState } from "react";
import { backend_url, emojiList } from "../constants";
import Search from "antd/es/input/Search";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { TargetUserContext } from "./Providers/TargetChatUserProvider";
import { UserContactsContext } from "./Providers/UserContacts";
import { SocketContext } from "./Providers/SocketProvider";
import Sider from "antd/es/layout/Sider";
import { Content, Header } from "antd/es/layout/layout";
import TextArea from "antd/es/input/TextArea";
import Video1 from "./Video1";

interface Message {
    username: string;
    msg?: string;
    audio?: string;
    recipient: string;
    type: string;
    msg_type: 'text' | 'audio';
}

export default function AppLayout({ children }: any) {
    const userData = useSelector((store: any) => store.user);
    const [searchValue, setSearchValue] = useState('')
    const [userContacts, setUserContacts] = useContext<any>(UserContactsContext)
    const [searchedUsers, setSearchedUsers] = useState([])
    const [targetUser, setTargetUser] = useContext<any>(TargetUserContext)
    const socketRef = useRef<any>(null);
    const [socket, setSocket] = useContext<any>(SocketContext)
    const [msg, setMsg] = useState<string>('');
    const [headerName, setHeaderName] = useState('Chats');
    const [activeView, setActiveView] = useState('chats');
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const [isChatStarted, setIsChatStarted] = useState<boolean>(false);
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const [callVisible, setCallVisible] = useState(false);
    const [open, setOpen] = useState(false);
    const [videoCallVisible, setVideoCallVisible] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<any>('1fcghj')
    const [selectedUser, setSelectedUser] = useState<any>({})
    const [socketId, setSocketId] = useState<any>('')
    const [showAddGroupModel, setShowAddGroupModel] = useState<boolean>(false)
    const [newGroupData, setNewGroupData] = useState({ name: '', user_id: userData?.userData.id })
    const [selectedGroup, setSelectedGroup] = useState<any>({})

    const messages = [
        { id: 1, text: "Hey there! Welcome to our Telegram-like chat.", sender: "John", time: "10:30 AM", isMe: false },
        { id: 2, text: "Thanks! The interface looks great!", sender: "You", time: "10:31 AM", isMe: true },
        { id: 3, text: "Feel free to explore all the features.", sender: "John", time: "10:32 AM", isMe: false },
    ];

    const [chats, setChats] = useState<any>([
        { id: '1fcghj', messages: [...messages.map((record) => { record.sender = 'User1'; return { ...record } })], name: "John Doe", message: "Hey there! Welcome...", time: "10:30 AM", unread: 2 },
        { id: '2fcghj', messages: [...messages.map((record) => { record.sender = 'User2'; return { ...record } })], name: "Alice Smith", message: "Are we meeting today?", time: "09:15 AM", unread: 0 },
        { id: '3fcghj', messages: [...messages.map((record) => { record.sender = 'User3'; return { ...record } })], name: "Tech Group", message: "New update available!", time: "Yesterday", unread: 5 },
    ]);

    const [calls, setCalls] = useState([
        { id: 1, name: "Alice Smith", time: "10:00 AM", duration: "5 min" },
        { id: 2, name: "John Doe", time: "09:30 AM", duration: "10 min" },
    ]);

    const [groups, setGroups] = useState([
        { id: 1, name: "Family", members: 5 },
        { id: 2, name: "Work", members: 10 },
    ]);

    console.log(userData)

    useEffect(() => {
        setSocket(socketRef.current)
    }, [socketRef])

    useEffect(() => {
        setSelectedUser(chats.filter((record: any) => record.id === selectedUserId)?.[0])
    }, [selectedUserId, chats])

    useEffect(() => {
        if (!socketRef.current) {
            socketRef.current = io(backend_url);
        }

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            setSocketId(socket.id)
            if (userData.email) {
                socket.emit('connect_user', { username: userData.email, type: userData.type });
            }
        });

        return () => {
            socket.off('connect');
        };
    }, [userData.email]);

    const handleLabelClick = (label: string, view: string) => {
        setHeaderName(label);
        setActiveView(view); // Update active view
    };

    useEffect(() => {
        (async () => {
            if (userData.type === 'custom') {
                const response: any = await fetch(`${backend_url}/connectedUsers?user_id=${userData.userData.id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }).then((data) => {
                    return data.json()
                }).then((data) => {
                    if (data.user_id) {
                        setUserContacts(data.connections.map((record: any) => {
                            return {
                                label: record.connected_user_info.username,
                                key: record.connected_user_id
                            }
                        }))
                    }
                    else {
                        setUserContacts([])
                    }
                });
                await fetch(`${backend_url}/user/${userData.userData.id}/groups`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }).then((data) => {
                    return data.json()
                }).then((data) => {
                    console.log(data)
                    setGroups([
                        ...groups,
                        ...data
                    ])
                });

            }
        })()
    }, [userData])

    function getUsers(value = searchValue) {
        fetch(`${backend_url}/getUsers?username=${value}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        }).then((data) => {
            return data.json()
        }).then((data) => {
            setSearchedUsers(data)
        });
    }

    function addGroup() {
        fetch(`${backend_url}/createGroup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `group_name=${newGroupData.name}&users=${JSON.stringify([newGroupData.user_id])}`,
        }).then((data) => {
            return data.json()
        }).then((data) => {
            setGroups([...groups, data.groupData])
        }).catch((e) => {
            console.log(e)
        }).finally(() => {
            setShowAddGroupModel(false)
            setNewGroupData({ ...newGroupData, name: '' })
        })
    }

    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const navigate = useNavigate()

    const handleLogout = () => {
        if (isLoggedIn) {
            setIsLoggedIn(false);
            navigate('/');
        } else {
            alert('Illegal activity detected');
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
    };

    const handleEmojiSelect = (value: any) => {
        setMsg((prev: any) => prev + value);
        hide();
    };

    const handleMicClick = () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
        } else {
            startRecording();
        }
    };

    const startRecording = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = () => {
                        const base64Audio = reader.result as string;
                        sendAudioMessage(base64Audio);
                    };
                    setIsRecording(false);
                };

                mediaRecorder.start();
                setIsRecording(true);
            } catch (error) {
                console.error("Error accessing microphone:", error);
                alert("Could not access your microphone. Please check permissions.");
            }
        } else {
            alert("Your browser does not support audio recording.");
        }
    };

    const sendAudioMessage = (audioData: string) => {
        if (isChatStarted) {
            const messageData: any = {
                username: userData.email,
                audio: audioData,
                recipient: selectedUser.name,
                type: 'audio',
            };
            socket.emit('chat_message', messageData);
            scrollToBottom();
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const hide = () => {
        setOpen(false);
    };

    console.log(userData)

    const sendMessage = () => {
        if (msg.trim()) {
            const messageData: Message = {
                username: userData.email,
                msg,
                recipient: selectedUser?.['name'],
                type: userData.type,
                msg_type: 'text',
            };
            socket.emit('chat_message', messageData);
            setMsg('');
            let contacts = chats
            if (contacts.filter((record: any) => record.id === selectedUserId).length !== 0) {
                let date = new Date()
                contacts = chats.map((record: any) => {
                    if (!record.unread) {
                        record.unread = 0
                    }
                    if (!record.messages) {
                        record.messages = []
                    }
                    if (record.id === selectedUserId) {
                        record.unread = 0
                        record.messages.push({ text: msg, sender: userData.email, time: date.getHours() + ':' + date.getMinutes(), isMe: false })
                    }
                    return record
                })
            }
            console.log(contacts, chats, selectedUser)
            setChats([...contacts])
            scrollToBottom();
        }
    };

    useEffect(() => {
        if (!userData.email) {
            navigate('/');
            return;
        }

        if (socket) {
            const handleMessages = (data: any) => {
                let contacts = chats
                let date = new Date()
                if (contacts.filter((record: any) => record.name === data.user_data['username']).length !== 0) {
                    contacts = chats.map((record: any) => {
                        if (!record.unread) {
                            record.unread = 0
                        }
                        if (!record.messages) {
                            record.messages = []
                        }
                        if (record.name === data.user_data['username']) {
                            record.unread = record.unread + 1
                            record.messages.push({ text: data.msg, sender: data.user_data['username'], time: date.getHours() + ':' + date.getMinutes(), isMe: false })
                            record.name = data.user_data['username']
                            record.id = data.user_data['id']
                        }
                        return record
                    })
                }
                else {
                    contacts.push({
                        unread: 1,
                        messages: [{ text: data.msg, sender: data.user_data['username'], time: date.getHours() + ':' + date.getMinutes(), isMe: false }],
                        msg: data.msg,
                        name: data.user_data['username'],
                        id: data.user_data['id'],
                    })
                }
                console.log(contacts)
                setChats([...contacts])
            };

            const handleTyping = (data: any) => {
                let contacts = userContacts
                contacts = contacts.map((record: any) => {
                    if (record.key === data.id) {
                        record.typing = true
                    }
                    return record
                })
                setUserContacts([...contacts])
            };

            socket.on('chat_start', (data: any) => {
                console.log(data)
            });

            socket.on('chat_message', (data: Message) => {
                console.log(data)
            });

            socket.on('typing', (data: any) => {
                console.log(data)
            });

            socket.on('user_left', () => {
                alert('Your chat partner has left the chat.');
            });

            socket.on('chat_message', handleMessages);
            socket.on('users_typing', handleTyping);

            return () => {
                socket.off('chat_start');
                socket.off('chat_message');
                socket.off('typing');
                socket.off('user_left');
                socket.off('chat_message', handleMessages);
                socket.off('users_typing', handleTyping);
            };
        }
    }, [userData.email, socket]);

    console.log(chats)

    const handleDeleteClick = () => {
        setIsRecording(false);
        // Stop and delete recording logic
    };

    const handleSendClick = () => {
        setIsRecording(false);
        // Send recording logic
    };

    

    return <div style={{ flexDirection: 'unset' }}>
        <Layout style={{ height: '100vh', background: '#E6E6E6' }}>
            {/* Sidebar */}
            <Sider width={300} style={{ background: '#fff', borderRight: '1px solid #eaeaea', padding: '10px', height: '100%' }}>
                <Header style={{ background: '#fff', padding: '0 16px', borderBottom: '1px solid #eaeaea' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Button type="text" icon={<MenuOutlined />} />
                        <h1 style={{ fontSize: '20px', fontWeight: '500', margin: 0 }}>{headerName}</h1>
                        <Button type="text" icon={<SettingOutlined />} />
                    </div>
                </Header>

                {/* Search Bar */}
                <div style={{ padding: '10px' }}>
                    <Select
                        placeholder="Search"
                        // prefix={<SearchOutlined />}
                        style={{ borderRadius: '20px', width: '200px' }}
                        showSearch={true}
                        onSearch={(value) => { getUsers(value) }}
                        onSelect={(value, record) => {
                            chats.push({
                                unread: 0,
                                messages: [],
                                msg: '',
                                name: value,
                                id: record.id,
                            });
                            setSelectedUserId(value)
                        }}
                    // onChange={(e) => setSearchValue(e.target.value)}
                    >
                        {
                            searchedUsers.map((user: any) => {
                                console.log(user)
                                return <Select.Option key={user.id} value={user.username}>{user.username}</Select.Option>
                            })
                        }
                    </Select>
                </div>

                {/* Labels for Sections */}
                <div style={{ display: 'flex' }}>
                    <div style={{ padding: '10px', height: '10%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', writingMode: 'vertical-rl', height: '70%', justifyContent: 'space-between' }}>
                            <h3 style={{ margin: 0, transform: 'rotate(180deg)', cursor: 'pointer' }} onClick={() => handleLabelClick('Calls', 'calls')}>Calls</h3>
                            <h3 style={{ margin: 0, transform: 'rotate(180deg)', cursor: 'pointer' }} onClick={() => handleLabelClick('Groups', 'groups')}>Groups</h3>
                            <h3 style={{ margin: 0, transform: 'rotate(180deg)', cursor: 'pointer' }} onClick={() => handleLabelClick('Chats', 'chats')}>Chats</h3>
                        </div>
                    </div>

                    <div style={{ padding: '10px 0', maxHeight: 'calc(100vh - 550px)', overflowY: 'auto' }}>
                        {activeView === 'chats' && chats.map((chat: any) => (
                            <div
                                key={chat.id}
                                style={{ padding: '10px', borderBottom: '1px solid #eaeaea', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                                onClick={() => {
                                    setSelectedUserId(chat.id)
                                    console.log(chat.id)
                                }}
                            >
                                <Badge count={chat.unread} offset={[10, 0]}>
                                    <Avatar style={{ backgroundColor: '#0088cc' }}>{chat.name?.charAt(0)}</Avatar>
                                </Badge>
                                <div style={{ marginLeft: '10px', flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{chat.name}</h3>
                                        <span style={{ fontSize: '12px', color: '#999' }}>{chat.time}</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {chat.message}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {activeView === 'calls' && calls.map((call) => (
                            <div key={call.id} style={{ padding: '10px', borderBottom: '1px solid #eaeaea' }}>
                                <h3 style={{ margin: 0 }}>{call.name}</h3>
                                <p style={{ margin: 0, color: '#999' }}>{call.time} - {call.duration}</p>
                            </div>
                        ))}
                        {
                            activeView === 'groups' && <>
                                <Button onClick={() => setShowAddGroupModel(true)}>Create group</Button>
                                {
                                    groups.map((group) => (
                                        <div key={group.id} style={{ padding: '10px', borderBottom: '1px solid #eaeaea' }}>
                                            <h3 style={{ margin: 0 }}>{group.name}</h3>
                                            <p style={{ margin: 0, color: '#999' }}>Members: {group?.members}</p>
                                        </div>
                                    ))
                                }
                            </>
                        }
                    </div>
                </div>
            </Sider>
            <Modal
                open={showAddGroupModel}
                onOk={() => { console.log('hi'); addGroup() }}
                onCancel={() => setShowAddGroupModel(false)}
            >
                <div>
                    <div>
                        Name
                    </div>
                    <Input
                        onChange={(e) => {
                            setNewGroupData({
                                ...newGroupData,
                                name: e.target.value
                            })
                        }}
                    />
                </div>
            </Modal>

            {/* Main Chat Area */}
            {
                activeView === 'chats' && <Layout style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Chat Header */}
                    <Header style={{ background: '#fff', padding: '0 16px', borderBottom: '1px solid #eaeaea' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar style={{ backgroundColor: '#0088cc', marginTop: '-60px' }}>{selectedUser?.['name']?.[0]}</Avatar>
                                <div style={{ marginLeft: '10px' }}>
                                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{selectedUser?.['name']}</h2>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>online</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '-50px' }}>
                                <Button type="text" icon={<SearchOutlined />} />
                                <Button type="text" style={{ transform: 'rotate(100deg)' }} onClick={() => setCallVisible(true)} icon={<PhoneOutlined />} />
                                {callVisible && (
                                    <div className="call-modal"
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            backgroundColor: '#fff',
                                            border: '1px solid #ccc',
                                            borderRadius: '8px',
                                            padding: '20px',
                                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                                            position: 'fixed',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            zIndex: 1000,
                                            width: '300px',
                                        }}
                                    >
                                        <h3>Call with {selectedUser.name}</h3>
                                        <div style={{
                                            display: 'flex', // Display buttons in a row
                                            justifyContent: 'space-between', // Space between buttons
                                            width: '100%',
                                        }}>
                                            <Button
                                                style={{
                                                    backgroundColor: 'green', // Green background for Start Call
                                                    color: '#fff', // White text color
                                                    border: 'none', // No border
                                                    borderRadius: '5px', // Rounded corners
                                                    padding: '10px 15px', // Padding for the button
                                                    cursor: 'pointer', // Pointer cursor on hover
                                                    flex: '1', // Allow button to grow and take available space
                                                    marginRight: '5px',
                                                }}
                                            >
                                                Start Call
                                            </Button>

                                            <Button
                                                onClick={() => setCallVisible(false)}  // Close the modal when clicked
                                                style={{
                                                    backgroundColor: 'grey', // Grey background for Close button
                                                    color: '#fff', // White text color
                                                    border: 'none', // No border
                                                    borderRadius: '5px', // Rounded corners
                                                    padding: '10px 15px', // Padding for the button
                                                    cursor: 'pointer', // Pointer cursor on hover
                                                    flex: '1',
                                                }}
                                            >
                                                Close
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <Button type="text" onClick={() => setVideoCallVisible(true)} icon={<VideoCameraOutlined />} />
                                <Button type="text" icon={<TeamOutlined />} />
                            </div>
                        </div>
                    </Header>

                    {/* Messages Area */}
                    <Content style={{ padding: '16px', backgroundColor: '#f0f2f5', overflowY: 'auto', maxHeight: 'calc(100vh - 128px)' }}>
                        {
                            activeView === 'chats' && (selectedUser?.['messages'] ?? []).map((msg: any) => (
                                <div key={msg.id} style={{ display: 'flex', justifyContent: msg.isMe ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
                                    <div style={{ maxWidth: '70%', padding: '10px 15px', borderRadius: '10px', backgroundColor: msg.isMe ? '#0084ff' : '#fff', color: msg.isMe ? '#fff' : '#000', border: msg.isMe ? 'none' : '1px solid #eaeaea', boxShadow: msg.isMe ? '0 2px 5px rgba(0, 132, 255, 0.2)' : 'none' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{msg.sender}</span>
                                            <span style={{ fontSize: '12px', color: '#999' }}>{msg.time}</span>
                                        </div>
                                        <p style={{ margin: '5px 0 0' }}>{msg.text}</p>
                                    </div>
                                </div>
                            ))
                        }

                        <Video1 socket={socket} me={socketId} partner={selectedUser?.name} videoCallVisible={videoCallVisible} setVideoCallVisible={setVideoCallVisible} />
                    </Content>

                    {/* Message Input */}
                    <div className="other-components" style={{ background: '#fff', padding: '16px', borderTop: '1px solid #eaeaea', display: 'flex', alignItems: 'center' }}>
                        <Button type="text" icon={<PaperClipOutlined />} />
                        <TextArea autoSize={{ minRows: 1, maxRows: 3 }} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Type a message..." style={{ borderRadius: '20px', border: '1px solid #eaeaea', flex: 1, marginLeft: '10px' }} />
                        <Popover
                            content={
                                <div style={{
                                    width: '500px',
                                    height: '500px',
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(5, 1fr)',
                                    gridAutoRows: 'minmax(80px, auto)',
                                    gap: '10px',
                                    overflowY: 'auto',
                                    padding: '10px',
                                    backgroundColor: '#ffffff',
                                }}>
                                    {emojiList.map((emoji) => (
                                        <div
                                            key={emoji.value}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                fontSize: '32px',
                                                borderRadius: '8px',
                                                transition: 'background-color 0.2s',
                                            }}
                                            onClick={() => handleEmojiSelect(emoji.label)} // Use emoji.label to append
                                            onMouseOver={(e) => {
                                                (e.currentTarget as HTMLDivElement).style.backgroundColor = '#f0f0f0';
                                            }}
                                            onMouseOut={(e) => {
                                                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                                            }}
                                        >
                                            {emoji.label}
                                        </div>
                                    ))}
                                </div>
                            }
                            title="Pick an Emoji"
                            trigger="click"
                            open={open}
                            onOpenChange={handleOpenChange}
                        >
                            <span
                                className="smiley-icon"
                                style={{ fontSize: '32px', color: 'black', cursor: 'pointer', marginRight: '8px' }}
                                title="Pick an Emoji"
                            >
                                <SmileOutlined style={{ fontSize: '30px', color: 'black', marginLeft: '20%', marginBottom: '30%' }} />
                            </span>
                        </Popover>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
      {isRecording && (
        <span
          className="delete-icon"
          onClick={handleDeleteClick}
          style={{
            cursor: 'pointer',
            color: 'red',
            fontSize: '20px',
            marginRight: '10px',
            transition: 'color 0.3s ease',
          }}
          title="Delete Recording"
        >
          <DeleteOutlined />
        </span>
      )}
      <span
        className="mic-icon"
        onClick={handleMicClick}
        style={{
          fontSize: '24px',
          cursor: 'pointer',
          color: isRecording ? 'red' : 'black',
          fontWeight: 'bold',
          transition: 'color 0.3s ease, transform 0.3s ease',
          animation: isRecording ? 'pulse 1s infinite ease-in-out' : 'none',
        }}
        title={isRecording ? "Stop Recording" : "Start Recording"}
      >
        <AudioOutlined />
      </span>
      {isRecording && (
        <span
          className="send-icon"
          onClick={handleSendClick}
          style={{
            cursor: 'pointer',
            color: 'green',
            fontSize: '20px',
            marginLeft: '10px',
            transition: 'color 0.3s ease',
          }}
          title="Send Recording"
        >
          <SendOutlined />
        </span>
      )}
      <style>
        {`
          @keyframes pulse {
              0% {
                  transform: scale(1);
                  opacity: 1;
              }
              50% {
                  transform: scale(1.1);
                  opacity: 0.8;
              }
              100% {
                  transform: scale(1);
                  opacity: 1;
              }
          }
        `}
      </style>
    </div>

                        <Button onClick={sendMessage} type="primary" icon={<SendOutlined />} style={{ marginLeft: '10px' }}>Send</Button>
                    </div>
                </Layout>
            }
            {
                activeView === 'groups' && <Layout style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Chat Header */}
                    <Header style={{ background: '#fff', padding: '0 16px', borderBottom: '1px solid #eaeaea' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar style={{ backgroundColor: '#0088cc', marginTop: '-60px' }}>{selectedGroup?.['name']?.[0]}</Avatar>
                                <div style={{ marginLeft: '10px' }}>
                                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{selectedGroup?.['name']}</h2>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>online</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '-50px' }}>
                                <Button type="text" icon={<SearchOutlined />} />
                                <Button type="text" style={{ transform: 'rotate(100deg)' }} onClick={() => setCallVisible(true)} icon={<PhoneOutlined />} />
                                {callVisible && (
                                    <div className="call-modal"
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            backgroundColor: '#fff',
                                            border: '1px solid #ccc',
                                            borderRadius: '8px',
                                            padding: '20px',
                                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                                            position: 'fixed',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            zIndex: 1000,
                                            width: '300px',
                                        }}
                                    >
                                        <h3>Call with {selectedUser.name}</h3>
                                        <div style={{
                                            display: 'flex', // Display buttons in a row
                                            justifyContent: 'space-between', // Space between buttons
                                            width: '100%',
                                        }}>
                                            <Button
                                                style={{
                                                    backgroundColor: 'green', // Green background for Start Call
                                                    color: '#fff', // White text color
                                                    border: 'none', // No border
                                                    borderRadius: '5px', // Rounded corners
                                                    padding: '10px 15px', // Padding for the button
                                                    cursor: 'pointer', // Pointer cursor on hover
                                                    flex: '1', // Allow button to grow and take available space
                                                    marginRight: '5px',
                                                }}
                                            >
                                                Start Call
                                            </Button>

                                            <Button
                                                onClick={() => setCallVisible(false)}  // Close the modal when clicked
                                                style={{
                                                    backgroundColor: 'grey', // Grey background for Close button
                                                    color: '#fff', // White text color
                                                    border: 'none', // No border
                                                    borderRadius: '5px', // Rounded corners
                                                    padding: '10px 15px', // Padding for the button
                                                    cursor: 'pointer', // Pointer cursor on hover
                                                    flex: '1',
                                                }}
                                            >
                                                Close
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <Button type="text" onClick={() => setVideoCallVisible(true)} icon={<VideoCameraOutlined />} />
                                <Button type="text" icon={<TeamOutlined />} />
                            </div>
                        </div>
                    </Header>

                    {/* Messages Area */}
                    <Content style={{ padding: '16px', backgroundColor: '#f0f2f5', overflowY: 'auto', maxHeight: 'calc(100vh - 128px)' }}>
                        {
                            (selectedGroup?.['messages'] ?? []).map((msg: any) => (
                                <div key={msg.id} style={{ display: 'flex', justifyContent: msg.isMe ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
                                    <div style={{ maxWidth: '70%', padding: '10px 15px', borderRadius: '10px', backgroundColor: msg.isMe ? '#0084ff' : '#fff', color: msg.isMe ? '#fff' : '#000', border: msg.isMe ? 'none' : '1px solid #eaeaea', boxShadow: msg.isMe ? '0 2px 5px rgba(0, 132, 255, 0.2)' : 'none' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{msg.sender}</span>
                                            <span style={{ fontSize: '12px', color: '#999' }}>{msg.time}</span>
                                        </div>
                                        <p style={{ margin: '5px 0 0' }}>{msg.text}</p>
                                    </div>
                                </div>
                            ))
                        }

                        {/* <Video1 socket={socket} me={socketId} partner={selected?.name} videoCallVisible={videoCallVisible} setVideoCallVisible={setVideoCallVisible} /> */}
                    </Content>

                    {/* Message Input */}
                    <div style={{ background: '#fff', padding: '16px', borderTop: '1px solid #eaeaea', display: 'flex', alignItems: 'center' }}>
                        <Button type="text" icon={<PaperClipOutlined />} />
                        <TextArea autoSize={{ minRows: 1, maxRows: 3 }} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Type a message..." style={{ borderRadius: '20px', border: '1px solid #eaeaea', flex: 1, marginLeft: '10px' }} />
                        <Popover
                            content={
                                <div style={{
                                    width: '500px',
                                    height: '500px',
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(5, 1fr)',
                                    gridAutoRows: 'minmax(80px, auto)',
                                    gap: '10px',
                                    overflowY: 'auto',
                                    padding: '10px',
                                    backgroundColor: '#ffffff',
                                }}>
                                    {emojiList.map((emoji) => (
                                        <div
                                            key={emoji.value}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                fontSize: '32px',
                                                borderRadius: '8px',
                                                transition: 'background-color 0.2s',
                                            }}
                                            onClick={() => handleEmojiSelect(emoji.label)} // Use emoji.label to append
                                            onMouseOver={(e) => {
                                                (e.currentTarget as HTMLDivElement).style.backgroundColor = '#f0f0f0';
                                            }}
                                            onMouseOut={(e) => {
                                                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                                            }}
                                        >
                                            {emoji.label}
                                        </div>
                                    ))}
                                </div>
                            }
                            title="Pick an Emoji"
                            trigger="click"
                            open={open}
                            onOpenChange={handleOpenChange}
                        >
                            <span
                                className="smiley-icon"
                                style={{ fontSize: '32px', color: 'black', cursor: 'pointer', marginRight: '8px' }}
                                title="Pick an Emoji"
                            >
                                <SmileOutlined style={{ fontSize: '30px', color: 'black', marginLeft: '20%', marginBottom: '30%' }} />
                            </span>
                        </Popover>
                        <span
                            className="mic-icon"
                            onClick={handleMicClick}
                            style={{ fontSize: '24px', cursor: 'pointer', color: isRecording ? 'red' : 'black', fontWeight: 'bold' }}
                            title={isRecording ? "Stop Recording" : "Start Recording"}

                        >

                            <AudioOutlined />

                        </span>
                        <Button onClick={sendMessage} type="primary" icon={<SendOutlined />} style={{ marginLeft: '10px' }}>Send</Button>
                    </div>
                </Layout>
            }
        </Layout>
    </div>
}
