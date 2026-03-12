import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCart } from '../../context/CartContext';
import { ADMIN_CONTACT } from '../../helpers/contact';
import { useNavigate } from 'react-router-dom';
import css from './ProfileContent.module.css';

const ProfileContent = ({ onLogout, closeParent }) => {
    const { bulkAddToCart, setIsCartOpen } = useCart();
    const navigate = useNavigate();
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('user');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.error("Profile user recovery failed:", e);
            return {};
        }
    });
    const [activeSection, setActiveSection] = useState('menu');
    const [orders, setOrders] = useState([]);
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(user.fullName || '');
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [newAddr, setNewAddr] = useState({ type: 'Home', address: '', isDefault: false });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
    const [referralSettings, setReferralSettings] = useState({ referrerReward: 20, newUserReward: 20 });

    useEffect(() => {
        fetchUserProfile();
        fetchUserOrders();
        fetchReferralSettings();
    }, []);

    const showMsg = (text, type = 'success') => {
        setStatusMsg({ text, type });
        setTimeout(() => setStatusMsg({ text: '', type: '' }), 3000);
    };

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await axios.get('/api/user/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setUser(res.data);
            setNewName(res.data.fullName);
            localStorage.setItem('user', JSON.stringify(res.data));
        } catch (err) {
            console.error('Failed to fetch profile');
        }
    };

    const fetchUserOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await axios.get('/api/user/orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setOrders(res.data);
        } catch (err) {
            console.error('Failed to fetch orders');
        }
    };

    const fetchReferralSettings = async () => {
        try {
            const res = await axios.get('/api/referrals/settings');
            if (res.data.success) {
                setReferralSettings(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch referral settings');
        }
    };

    const handleUpdateName = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put('/api/user/profile', { fullName: newName }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setUser(res.data);
            setIsEditingName(false);
            localStorage.setItem('user', JSON.stringify(res.data));
            showMsg('Name updated successfully');
        } catch (err) {
            showMsg('Failed to update name', 'error');
        }
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/user/addresses', newAddr, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setUser(prev => ({ ...prev, addresses: res.data }));
            setShowAddressForm(false);
            setNewAddr({ type: 'Home', address: '', isDefault: false });
            showMsg('Address added successfully');
        } catch (err) {
            showMsg('Failed to add address', 'error');
        }
    };

    const handleDeleteAddress = async (addrId) => {
        if (!window.confirm('Delete this address?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.delete(`/api/user/addresses/${addrId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setUser(prev => ({ ...prev, addresses: res.data }));
            showMsg('Address deleted');
        } catch (err) {
            showMsg('Failed to delete address', 'error');
        }
    };

    const handleReorder = (orderItems, restaurantName) => {
        try {
            const itemsToPush = orderItems.map(item => ({
                ...item,
                id: item.id || item._id || Math.random().toString(36).substr(2, 9),
                image: item.image || item.img || '/images/food-placeholder.png'
            }));

            bulkAddToCart(itemsToPush, restaurantName);
            showMsg('Items added! Redirecting...');

            // Close the profile drawer and go to checkout
            if (closeParent) closeParent();
            setIsCartOpen(false); // Close cart drawer so it doesn't overlap

            // Short delay for smooth transition
            setTimeout(() => {
                navigate('/checkout');
            }, 300);
        } catch (err) {
            showMsg(err.message || 'Error reordering items', 'error');
        }
    };

    const renderMenu = () => (
        <div className={css.menuList}>
            {statusMsg.text && <div className={`${css.statusMsg} ${css[statusMsg.type]}`}>{statusMsg.text}</div>}
            <div className={css.userSummary}>
                <div className={css.avatarLarge}>
                    {user.profilePic ? (
                        <img src={user.profilePic} alt="Profile" className={css.summaryImg} />
                    ) : (
                        user.fullName?.charAt(0) || 'U'
                    )}
                </div>
                <div className={css.userSummaryInfo}>
                    <h3>{user.fullName}</h3>
                    <div className={css.walletPill}>💰 Wallet: ₹{user.walletBalance || 0}</div>
                    <p>{user.mobile}</p>
                </div>
            </div>

            <div className={css.menuItem} onClick={() => setActiveSection('profile')}>
                <div className={css.menuIcon}>👤</div>
                <div className={css.menuText}>
                    <div className={css.menuTitle}>My Profile</div>
                    <div className={css.menuSub}>Name, Mobile number</div>
                </div>
            </div>
            <div className={css.menuItem} onClick={() => setActiveSection('orders')}>
                <div className={css.menuIcon}>🛍️</div>
                <div className={css.menuText}>
                    <div className={css.menuTitle}>My Orders</div>
                    <div className={css.menuSub}>View history and bills</div>
                </div>
            </div>
            <div className={css.menuItem} onClick={() => setActiveSection('addresses')}>
                <div className={css.menuIcon}>📍</div>
                <div className={css.menuText}>
                    <div className={css.menuTitle}>Saved Addresses</div>
                    <div className={css.menuSub}>Manage delivery locations</div>
                </div>
            </div>
            <div className={`${css.menuItem} ${css.referralItem}`} onClick={() => setActiveSection('referral')}>
                <div className={css.menuIcon}>🎁</div>
                <div className={css.menuText}>
                    <div className={css.menuTitle}>Refer & Earn ₹{referralSettings.referrerReward}</div>
                    <div className={css.menuSub}>Invite friends to FoodRiders</div>
                </div>
            </div>

            {orders.find(o => !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(o.status)) && (
                <div
                    className={css.menuItem}
                    onClick={() => {
                        const active = orders.find(o => !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(o.status));
                        if (active) navigate(`/order-tracking/${active._id}`);
                    }}
                >
                    <div className={css.menuIcon}>🚚</div>
                    <div className={css.menuText}>
                        <div className={css.menuTitle}>Track Current Order</div>
                        <div className={css.menuSub}>Live status available</div>
                    </div>
                </div>
            )}

            <div className={css.menuItem} onClick={() => setActiveSection('notifications')}>
                <div className={css.menuIcon}>🔔</div>
                <div className={css.menuText}>
                    <div className={css.menuTitle}>Notifications</div>
                    <div className={css.menuSub}>Order & Promo alerts</div>
                </div>
            </div>

            <div className={css.menuItem} onClick={() => setActiveSection('help')}>
                <div className={css.menuIcon}>🎧</div>
                <div className={css.menuText}>
                    <div className={css.menuTitle}>Help & Support</div>
                    <div className={css.menuSub}>Chat, Call, WhatsApp</div>
                </div>
            </div>
            <div className={css.menuItem} onClick={() => setActiveSection('about')}>
                <div className={css.menuIcon}>ℹ️</div>
                <div className={css.menuText}>
                    <div className={css.menuTitle}>About FoodRiders</div>
                    <div className={css.menuSub}>Learn more about us</div>
                </div>
            </div>
            <div className={css.menuItem} onClick={() => setActiveSection('terms')}>
                <div className={css.menuIcon}>📄</div>
                <div className={css.menuText}>
                    <div className={css.menuTitle}>Terms & Conditions</div>
                    <div className={css.menuSub}>User agreement and rules</div>
                </div>
            </div>
            <div className={css.menuItem} onClick={() => setActiveSection('privacy')}>
                <div className={css.menuIcon}>🔒</div>
                <div className={css.menuText}>
                    <div className={css.menuTitle}>Privacy Policy</div>
                    <div className={css.menuSub}>How we handle your data</div>
                </div>
            </div>
            <div className={`${css.menuItem} ${css.logout}`} onClick={onLogout}>
                <div className={css.menuIcon}>🚪</div>
                <div className={css.menuText}>
                    <div className={css.menuTitle}>Logout</div>
                    <div className={css.menuSub}>Sign out from FoodRiders</div>
                </div>
            </div>
        </div>
    );

    const renderProfile = () => (
        <div className={css.sectionContent}>
            <div className={css.sectionHeader}>
                <button className={css.backBtn} onClick={() => setActiveSection('menu')}>←</button>
                <h3>My Profile</h3>
            </div>
            {statusMsg.text && <div className={`${css.statusMsg} ${css[statusMsg.type]}`}>{statusMsg.text}</div>}
            <div className={css.profileCard}>
                <div className={css.profilePicSection}>
                    <div className={css.avatarPreview}>
                        {user.profilePic ? (
                            <img src={user.profilePic} alt="Profile" className={css.profileImg} />
                        ) : (
                            <div className={css.avatarInitial}>{user.fullName?.charAt(0)}</div>
                        )}
                        <label className={css.uploadLabel}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;

                                    const formData = new FormData();
                                    formData.append('profilePic', file);

                                    try {
                                        const res = await fetch('/api/user/upload-profile-pic', {
                                            method: 'POST',
                                            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                                            body: formData
                                        });
                                        const data = await res.json();
                                        if (res.ok) {
                                            const updatedUser = { ...user, profilePic: data.profilePic };
                                            localStorage.setItem('user', JSON.stringify(updatedUser));
                                            window.location.reload(); // Force refresh to sync everywhere
                                        } else {
                                            alert(data.msg || 'Upload failed');
                                        }
                                    } catch (err) {
                                        alert('Error uploading image');
                                    }
                                }}
                                hidden
                            />
                            <span className={css.cameraIcon}>📷</span>
                        </label>
                    </div>
                    <p className={css.uploadHint}>Tap camera to change photo</p>
                </div>
                <div className={css.field}>
                    <label>Mobile Number</label>
                    <span className={css.readOnly}>{user.mobile}</span>
                </div>
                <div className={css.field}>
                    <label>Full Name</label>
                    {isEditingName ? (
                        <div className={css.editRow}>
                            <input value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
                            <div className={css.editActions}>
                                <button className={css.cancelBtn} onClick={() => setIsEditingName(false)}>Cancel</button>
                                <button className={css.saveBtn} onClick={handleUpdateName}>Save</button>
                            </div>
                        </div>
                    ) : (
                        <div className={css.displayRow}>
                            <span>{user.fullName}</span>
                            <button className={css.editBtn} onClick={() => setIsEditingName(true)}>Edit</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderOrders = () => (
        <div className={css.sectionContent}>
            <div className={css.sectionHeader}>
                <button className={css.backBtn} onClick={() => setActiveSection('menu')}>←</button>
                <h3>My Orders</h3>
            </div>
            <div className={css.orderList}>
                {orders.length === 0 ? <p className={css.empty}>No orders yet</p> :
                    orders.map(order => (
                        <div key={order._id} className={css.orderCard}>
                            <div className={css.orderHead}>
                                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                                <span className={css.statusBadge} data-status={order.status}>{order.status}</span>
                            </div>
                            <div className={css.orderItems}>
                                {order.items.map((item, idx) => (
                                    <div key={idx}>{item.name} x {item.quantity}</div>
                                ))}
                            </div>

                            {/* Payment Screenshot Thumbnail */}
                            {order.paymentScreenshot && (
                                <div className={css.paymentProofThumb} onClick={() => window.open(order.paymentScreenshot, '_blank')}>
                                    <div className={css.proofLabel}>📸 Payment Proof</div>
                                    <img src={order.paymentScreenshot} alt="Payment Proof" className={css.proofImg} />
                                </div>
                            )}

                            <div className={css.orderFoot}>
                                <strong>₹{order.totalAmount}</strong>
                                <div className={css.orderActions}>
                                    <button className={css.billBtn} onClick={() => setSelectedOrder(order)}>View Bill</button>
                                    <button className={css.reorderBtn} onClick={() => {
                                        const restName = order.restaurantName || (order.items && order.items[0]?.restaurant);
                                        handleReorder(order.items, restName);
                                    }}>Reorder</button>
                                </div>
                            </div>
                        </div>
                    ))
                }
            </div>

            {selectedOrder && (
                <div className={css.billModal}>
                    <div className={css.billContent}>
                        <h4>Order Summary</h4>
                        <div className={css.billCustomer}>Customer: <strong>{user.fullName}</strong></div>
                        <hr />
                        {selectedOrder.items.map(item => (
                            <div key={item.id} className={css.billItem}>
                                <span>{item.name} x {item.quantity}</span>
                                <span>₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                        <hr />
                        <div className={css.billTotal}>
                            <span>Total Amount</span>
                            <span>₹{selectedOrder.totalAmount}</span>
                        </div>
                        <button className={css.closeBill} onClick={() => setSelectedOrder(null)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );

    const renderAddresses = () => (
        <div className={css.sectionContent}>
            <div className={css.sectionHeader}>
                <button className={css.backBtn} onClick={() => setActiveSection('menu')}>←</button>
                <h3>Saved Addresses</h3>
            </div>
            <div className={css.addressList}>
                {user.addresses?.length === 0 && !showAddressForm ? <p className={css.empty}>No saved addresses</p> :
                    user.addresses?.map(addr => (
                        <div key={addr._id} className={css.addressCard}>
                            <div className={css.addrTypeRow}>
                                <span className={css.addrTag}>{addr.type}</span>
                                {addr.isDefault && <span className={css.defaultTag}>Default</span>}
                                <button className={css.delAddr} onClick={() => handleDeleteAddress(addr._id)}>Delete</button>
                            </div>
                            <div className={css.addrText}>{addr.address}</div>
                        </div>
                    ))
                }

                {showAddressForm ? (
                    <form className={css.addressForm} onSubmit={handleAddAddress}>
                        <div className={css.typeSelector}>
                            {['Home', 'Work', 'Other'].map(t => (
                                <button key={t} type="button"
                                    className={newAddr.type === t ? css.activeType : ''}
                                    onClick={() => setNewAddr({ ...newAddr, type: t })}
                                >{t}</button>
                            ))}
                        </div>
                        <textarea
                            placeholder="Complete Address"
                            required
                            value={newAddr.address}
                            onChange={e => setNewAddr({ ...newAddr, address: e.target.value })}
                        />
                        <label className={css.defaultLabel}>
                            <input type="checkbox" checked={newAddr.isDefault}
                                onChange={e => setNewAddr({ ...newAddr, isDefault: e.target.checked })}
                            /> Set as Default
                        </label>
                        <div className={css.formBtns}>
                            <button type="button" onClick={() => setShowAddressForm(false)}>Cancel</button>
                            <button type="submit" className={css.submitBtn}>Save Address</button>
                        </div>
                    </form>
                ) : (
                    <button className={css.addBtn} onClick={() => setShowAddressForm(true)}>+ Add New Address</button>
                )}
            </div>
        </div>
    );

    const renderNotifications = () => (
        <div className={css.sectionContent}>
            <div className={css.sectionHeader}>
                <button className={css.backBtn} onClick={() => setActiveSection('menu')}>←</button>
                <h3>Notifications</h3>
            </div>
            <div className={css.prefList}>
                <div className={css.prefItem}>
                    <div>
                        <h4>Order Status</h4>
                        <p>Track your food arrival</p>
                    </div>
                    <label className={css.switch}>
                        <input type="checkbox" defaultChecked />
                        <span className={css.slider}></span>
                    </label>
                </div>
                <div className={css.prefItem}>
                    <div>
                        <h4>Daily Offers</h4>
                        <p>Get notified about deals</p>
                    </div>
                    <label className={css.switch}>
                        <input type="checkbox" />
                        <span className={css.slider}></span>
                    </label>
                </div>
            </div>
        </div>
    );

    const renderHelp = () => (
        <div className={css.sectionContent}>
            <div className={css.sectionHeader}>
                <button className={css.backBtn} onClick={() => setActiveSection('menu')}>←</button>
                <h3>Help & Support</h3>
            </div>
            <div className={css.supportOptions}>
                <div className={css.supportItem}>
                    <h4>Chat with Support</h4>
                    <p>Live chat active 9 AM - 11 PM</p>
                    <button className={css.chatBtn}>Start Chat</button>
                </div>
                <div className={css.supportItem}>
                    <h4>Call Helpline</h4>
                    <p>Quick assistance via call</p>
                    <button className={css.callBtn} onClick={() => window.location.href = `tel:${ADMIN_CONTACT.phone}`}>Call {ADMIN_CONTACT.phone}</button>
                </div>
                <div className={css.supportItem}>
                    <h4>WhatsApp Support</h4>
                    <button className={css.waBtn} onClick={() => window.location.href = `https://wa.me/${ADMIN_CONTACT.whatsapp}`}>WhatsApp Us</button>
                </div>
            </div>
        </div>
    );

    const renderAbout = () => (
        <div className={css.sectionContent}>
            <div className={css.sectionHeader}>
                <button className={css.backBtn} onClick={() => setActiveSection('menu')}>←</button>
                <h3>About FoodRiders</h3>
            </div>
            <div className={css.infoContent}>
                <p><strong>FoodRiders</strong> is Mahalingapura's premium food delivery service, bringing your favorite local flavors right to your doorstep.</p>
                <p>Our mission is to support local businesses while providing a seamless, high-quality ordering experience for our community.</p>
                <div className={css.version}>Version 1.0.42 (Build 202)</div>
            </div>
        </div>
    );

    const renderTerms = () => (
        <div className={css.sectionContent}>
            <div className={css.sectionHeader}>
                <button className={css.backBtn} onClick={() => setActiveSection('menu')}>←</button>
                <h3>Terms & Conditions</h3>
            </div>
            <div className={css.infoContent}>
                <h4>1. Acceptance of Terms</h4>
                <p>By using FoodRiders, you agree to comply with our delivery policies and community guidelines.</p>
                <h4>2. Ordering & Payment</h4>
                <p>All orders are subject to availability. Payments can be made via UPI or Cash on Delivery.</p>
                <h4>3. Cancellations</h4>
                <p>Orders can only be cancelled before they are accepted by the restaurant.</p>
            </div>
        </div>
    );

    const renderPrivacy = () => (
        <div className={css.sectionContent}>
            <div className={css.sectionHeader}>
                <button className={css.backBtn} onClick={() => setActiveSection('menu')}>←</button>
                <h3>Privacy Policy</h3>
            </div>
            <div className={css.infoContent}>
                <h4>Data Collection</h4>
                <p>We collect your name, mobile number, and address to facilitate deliveries.</p>
                <h4>Data Usage</h4>
                <p>Your data is never sold to third parties and is only used for order processing.</p>
                <h4>Location Tracking</h4>
                <p>We use your location only when the app is in use to provide accurate delivery tracking.</p>
            </div>
        </div>
    );

    const renderReferral = () => {
        const refLink = `${window.location.origin}/signup?ref=${user.referralCode}`;

        const copyToClipboard = () => {
            navigator.clipboard.writeText(refLink);
            showMsg('Referral link copied!');
        };

        return (
            <div className={css.sectionContent}>
                <div className={css.sectionHeader}>
                    <button className={css.backBtn} onClick={() => setActiveSection('menu')}>←</button>
                    <h3>Refer & Earn</h3>
                </div>
                <div className={css.referralCard}>
                    <div className={css.referralGraphic}>🎁</div>
                    <h4>Invite friends and earn ₹{referralSettings.referrerReward}!</h4>
                    <p>Share your link with friends. When they place their first order, {referralSettings.referrerReward === referralSettings.newUserReward ? `both of you get ₹${referralSettings.referrerReward}` : `you get ₹${referralSettings.referrerReward} and they get ₹${referralSettings.newUserReward}`} in your wallet!</p>

                    <div className={css.codeBox}>
                        <label>Your Referral Code</label>
                        <div className={css.codeDisplay}>{user.referralCode}</div>
                    </div>

                    <div className={css.linkBox}>
                        <label>Share Link</label>
                        <div className={css.linkDisplay}>
                            <input readOnly value={refLink} />
                            <button onClick={copyToClipboard}>Copy</button>
                        </div>
                    </div>

                    <div className={css.referralStats}>
                        <div className={css.statItem}>
                            <span>Successful Referrals</span>
                            <strong>{user.referralCount || 0} / 10</strong>
                        </div>
                    </div>

                    <button className={css.shareWhatsapp} onClick={() => window.open(`https://wa.me/?text=Order delicious food from FoodRiders and get ₹${referralSettings.newUserReward} discount on your first order using my link: ${refLink}`, '_blank')}>
                        Share on WhatsApp
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className={css.container}>
            {activeSection === 'menu' && renderMenu()}
            {activeSection === 'profile' && renderProfile()}
            {activeSection === 'orders' && renderOrders()}
            {activeSection === 'addresses' && renderAddresses()}
            {activeSection === 'referral' && renderReferral()}
            {activeSection === 'notifications' && renderNotifications()}
            {activeSection === 'help' && renderHelp()}
            {activeSection === 'about' && renderAbout()}
            {activeSection === 'terms' && renderTerms()}
            {activeSection === 'privacy' && renderPrivacy()}
        </div>
    );
};

export default ProfileContent;
