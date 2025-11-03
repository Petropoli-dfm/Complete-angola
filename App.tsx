import React, { useState, useEffect } from 'react';
import AuthComponent from './components/Auth.tsx';
import Layout from './data/Layout.tsx';
import AdminLayout from './components/admin/AdminLayout.tsx';
import { User, SimpleFirebaseUser, AppNotification } from './types.ts';
import { 
    auth,
    db,
    doc,
    setDoc,
    getDoc,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    FirebaseUser,
    increment,
    arrayUnion,
    updateDoc
} from './services/firebase.ts';
import { Spinner } from './components/Icons.tsx';
import { useNotifications } from './hooks/useNotifications.ts';

interface AuthState {
    firebaseUser: SimpleFirebaseUser | null;
    role: 'user' | 'admin' | null;
}

const App: React.FC = () => {
    const { toasts, showNotification, dismissNotification } = useNotifications();
    const [authData, setAuthData] = useState<AuthState>({ firebaseUser: null, role: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for referral code in URL on initial load
        const urlParams = new URLSearchParams(window.location.search);
        const inviteCode = urlParams.get('invite');
        let refId: string | null = null;
        
        if (inviteCode && inviteCode.startsWith('complete-angola-')) {
            refId = inviteCode.substring('complete-angola-'.length);
        }
        
        if (refId) {
            localStorage.setItem('referralId', refId);
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                const simpleUser: SimpleFirebaseUser = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                };

                if (firebaseUser.email === 'admin@gmail.com') {
                    setAuthData({ firebaseUser: simpleUser, role: 'admin' });
                } else {
                    // Check if user document exists in Firestore
                    const userDocRef = doc(db, "users", firebaseUser.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (!userDoc.exists()) {
                         // If it doesn't exist, create it. This happens on first login after registration.
                         const referralId = localStorage.getItem('referralId');
                         
                         const newUser: User = {
                            id: firebaseUser.uid,
                            name: firebaseUser.displayName || firebaseUser.email || 'Novo Utilizador',
                            email: firebaseUser.email || '',
                            balance: 0,
                            activeInvestments: [],
                            withdrawalHistory: [],
                            hasDeposited: false,
                            gamesPlayed: 0,
                            notifications: [],
                            isActive: true, // Default to active
                            referrerId: referralId || null,
                            invitedUsersCount: 0,
                            hasPurchasedLevelZero: false,
                            investmentsMigrated_v2: true,
                        };
                        await setDoc(userDocRef, newUser);

                        if (referralId) {
                            try {
                                const referrerDocRef = doc(db, "users", referralId);
                                const referrerDoc = await getDoc(referrerDocRef);
                                
                                if (referrerDoc.exists()) {
                                    const referrerData = referrerDoc.data() as User;
                                    const newInvitedCount = (referrerData.invitedUsersCount || 0) + 1;
                                    const INVITE_GOAL = 40;
                                    const CYCLE_BONUS = 5000;

                                    const updates: { [key: string]: any } = {
                                        invitedUsersCount: newInvitedCount,
                                    };

                                    // Check if the cycle is completed with this new user
                                    if (newInvitedCount === INVITE_GOAL) {
                                        updates.balance = increment(CYCLE_BONUS);
                                        const cycleBonusNotification: AppNotification = {
                                            id: `notif-cycle-bonus-${Date.now()}`,
                                            message: `Parabéns! Você completou o ciclo de ${INVITE_GOAL} convidados e ganhou ${CYCLE_BONUS.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}!`,
                                            timestamp: Date.now(),
                                            read: false,
                                        };
                                        updates.notifications = arrayUnion(cycleBonusNotification);
                                    }
                                    
                                    await updateDoc(referrerDocRef, updates);
                                }
                            } catch (error) {
                                console.error("Error updating referrer count and bonus:", error);
                            } finally {
                                localStorage.removeItem('referralId');
                            }
                        }
                    }
                    setAuthData({ firebaseUser: simpleUser, role: 'user' });
                }
            } else {
                setAuthData({ firebaseUser: null, role: null });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);


    const handleRegister = async (name: string, email: string, pass: string) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            await updateProfile(userCredential.user, { displayName: name });
            // The user document will be created on the first login via the onAuthStateChanged listener
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                throw new Error('Este email já está registado. Por favor, faça login.');
            } else if (error.code === 'auth/weak-password') {
                throw new Error('A palavra-passe é muito fraca. Use pelo menos 6 caracteres.');
            } else {
                console.error("Registration error:", error);
                throw new Error('Ocorreu um erro durante o registo. Tente novamente.');
            }
        }
    };


    const handleLogin = async (email: string, pass: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                throw new Error('Email ou palavra-passe incorretos.');
            } else {
                console.error("Login error:", error);
                throw new Error('Ocorreu um erro durante o login. Tente novamente.');
            }
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            showNotification('Erro ao sair.');
        }
    };

    if (loading) {
        return (
            <div className="bg-brand-black min-h-screen flex items-center justify-center">
                <Spinner className="w-10 h-10 text-brand-yellow" />
            </div>
        );
    }

    if (!authData.firebaseUser) {
        return <AuthComponent login={handleLogin} register={handleRegister} onSuccess={showNotification} />;
    }

    if (authData.role === 'admin') {
        return <AdminLayout logout={handleLogout} />;
    }
    
    if (authData.role === 'user' && authData.firebaseUser) {
         return (
            <Layout 
                firebaseUser={authData.firebaseUser}
                logout={handleLogout}
                toasts={toasts}
                showNotification={showNotification}
                dismissNotification={dismissNotification}
            />
        );
    }

    return null;
};

export default App;