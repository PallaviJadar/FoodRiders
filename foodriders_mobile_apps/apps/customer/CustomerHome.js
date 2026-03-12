import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    Image, TextInput, ActivityIndicator, ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../../shared/api/axios';
import { Search, Star, Clock, ChevronRight, MapPin } from 'lucide-react-native';

export default function CustomerHome() {
    const [restaurants, setRestaurants] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [restResp, annResp, catResp] = await Promise.all([
                    api.get('/restaurant'),
                    api.get('/announcements'),
                    api.get('/carousel')
                ]);
                setRestaurants(restResp.data || []);
                setAnnouncements(annResp.data || []);
                setCategories(catResp.data || []);
                setFiltered(restResp.data || []);
            } catch (err) {
                console.error('Failed to fetch home data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFiltered(restaurants);
        } else {
            setFiltered(
                restaurants.filter(r =>
                    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.cuisineType?.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
        }
    }, [searchQuery, restaurants]);

    const renderRestaurantCard = ({ item }) => {
        const isOpen = item.isOpen !== false;

        return (
            <TouchableOpacity
                style={[styles.card, !isOpen && styles.cardClosed]}
                onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: item._id, name: item.name })}
                disabled={!isOpen}
            >
                <View style={styles.imageContainer}>
                    {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl.startsWith('data:') ? item.imageUrl : `https://www.foodriders.in${item.imageUrl}` }} style={styles.image} />
                    ) : (
                        <View style={[styles.image, styles.imagePlaceholder]}>
                            <Text style={styles.imagePlaceholderText}>🍽️</Text>
                        </View>
                    )}
                    {!isOpen && (
                        <View style={styles.closedOverlay}>
                            <Text style={styles.closedText}>CLOSED</Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardInfo}>
                    <Text style={styles.restName}>{item.name}</Text>
                    {item.cuisineType && (
                        <Text style={styles.cuisine}>{item.cuisineType}</Text>
                    )}
                    <View style={styles.metaRow}>
                        {item.rating && (
                            <View style={styles.ratingBadge}>
                                <Star color="#fff" size={11} fill="#fff" />
                                <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                            </View>
                        )}
                        <View style={styles.metaItem}>
                            <Clock color="#888" size={13} />
                            <Text style={styles.metaText}>{item.deliveryTime || '30-45'} min</Text>
                        </View>
                    </View>
                </View>
                <ChevronRight color="#ccc" size={20} style={styles.arrow} />
            </TouchableOpacity>
        );
    };

    const ListHeader = () => (
        <View style={styles.headerContent}>
            {/* Exactly Matching Website Hero */}
            <View style={styles.yellowHero}>
                {/* Floating Bg Icons */}
                <Image source={{ uri: 'https://www.foodriders.in/banners/icons/pizza.png' }} style={[styles.heroIcon, { top: '10%', left: '5%' }]} />
                <Image source={{ uri: 'https://www.foodriders.in/banners/icons/burger.png' }} style={[styles.heroIcon, { bottom: '20%', left: '15%' }]} />
                <Image source={{ uri: 'https://www.foodriders.in/banners/icons/biryani.png' }} style={[styles.heroIcon, { top: '15%', right: '5%' }]} />
                <Image source={{ uri: 'https://www.foodriders.in/banners/icons/cake.png' }} style={[styles.heroIcon, { bottom: '25%', right: '15%' }]} />

                <Image
                    source={{ uri: 'https://www.foodriders.in/images/delivery-boy-1.png' }}
                    style={styles.heroCharLeft}
                />
                <Image
                    source={{ uri: 'https://www.foodriders.in/images/delivery-boy-2.png' }}
                    style={styles.heroCharRight}
                />

                <View style={styles.heroCenter}>
                    <Text style={styles.heroLogo}>FoodRiders</Text>
                    <Text style={styles.heroSubText}>
                        Discover the best food & drinks in <Text style={{ color: '#ed1c24', fontWeight: 'bold' }}>Mahalingapura</Text>
                    </Text>

                    <View style={styles.mainSearchBox}>
                        <MapPin color="#ed1c24" size={18} />
                        <Text style={styles.locText}>Mha..</Text>
                        <View style={styles.searchDivider} />
                        <Search color="#888" size={18} />
                        <TextInput
                            style={styles.heroSearchInput}
                            placeholder="Search for restau..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>
            </View>

            {/* Announcements Segment */}
            {announcements.length > 0 && (
                <View style={styles.annSection}>
                    <View style={styles.secHeader}>
                        <Text style={styles.secTitle}>📢 Today's Specials & Announcements</Text>
                        <Text style={styles.secSubTitle}>Stay updated with the latest happenings!</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.annScroll}>
                        {announcements.map((ann, idx) => (
                            <TouchableOpacity key={idx} style={styles.annCard}>
                                <Image
                                    source={{ uri: ann.image?.startsWith('http') ? ann.image : `https://www.foodriders.in/uploads/${ann.image}` }}
                                    style={styles.annImage}
                                />
                                <View style={styles.annBadge}>
                                    <Text style={styles.annBadgeText}>{ann.type}</Text>
                                </View>
                                <Text style={styles.annTitle} numberOfLines={1}>{ann.title}</Text>
                                <Text style={styles.annDesc} numberOfLines={1}>{ann.description}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Inspiration Categories Segment */}
            {categories.length > 0 && (
                <View style={styles.catSection}>
                    <Text style={styles.catSectionTitle}>Inspiration for your first order</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                        {categories.map((cat, idx) => (
                            <TouchableOpacity key={idx} style={styles.catItem}>
                                <View style={styles.catIconCircle}>
                                    <Image
                                        source={{ uri: cat.image?.startsWith('http') ? cat.image : `https://www.foodriders.in${cat.image}` }}
                                        style={styles.catIconImg}
                                    />
                                </View>
                                <Text style={styles.catName}>{cat.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            <View style={styles.divider} />
            <Text style={styles.nearbyTitle}>Featured Restaurants</Text>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ed1c24" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={filtered}
                keyExtractor={item => item._id}
                renderItem={renderRestaurantCard}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>🔍</Text>
                        <Text style={styles.emptyTitle}>No restaurants found</Text>
                        <Text style={styles.emptySubtitle}>Try searching something else</Text>
                    </View>
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fdfdfd' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    headerContent: { width: '100%', marginBottom: 15 },

    // Website-match Yellow Hero
    yellowHero: {
        backgroundColor: '#ffdb58',
        paddingTop: 40,
        paddingBottom: 60,
        position: 'relative',
        height: 280,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroCharLeft: {
        position: 'absolute',
        bottom: 0,
        left: -10,
        width: 140,
        height: 140,
        resizeMode: 'contain',
        zIndex: 1,
    },
    heroCharRight: {
        position: 'absolute',
        bottom: 0,
        right: -10,
        width: 140,
        height: 140,
        resizeMode: 'contain',
        zIndex: 1,
    },
    heroCenter: {
        alignItems: 'center',
        zIndex: 2,
        width: '90%',
    },
    heroLogo: {
        fontSize: 42,
        fontWeight: '900',
        color: '#ed1c24',
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    heroSubText: {
        fontSize: 14,
        color: '#555',
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: '500',
    },
    mainSearchBox: {
        backgroundColor: '#fff',
        width: '100%',
        height: 50,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    locText: { fontSize: 13, color: '#333', marginLeft: 5, fontWeight: '600' },
    searchDivider: { width: 1, height: '60%', backgroundColor: '#eee', marginHorizontal: 10 },
    heroSearchInput: { flex: 1, fontSize: 14, color: '#333' },

    // Announcements
    annSection: { marginTop: 25, paddingHorizontal: 15 },
    secHeader: { marginBottom: 15 },
    secTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },
    secSubTitle: { fontSize: 12, color: '#888', marginTop: 2 },
    annScroll: { flexDirection: 'row' },
    annCard: {
        width: 200,
        backgroundColor: '#fff',
        borderRadius: 15,
        marginRight: 15,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        paddingBottom: 10,
    },
    annImage: { width: '100%', height: 110, resizeMode: 'cover' },
    annBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(237,28,36,0.9)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 5,
    },
    annBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    annTitle: { fontSize: 13, fontWeight: 'bold', color: '#333', marginTop: 8, paddingHorizontal: 10 },
    annDesc: { fontSize: 11, color: '#777', marginTop: 2, paddingHorizontal: 10 },

    // Inspiration Categories
    catSection: { marginTop: 30, paddingHorizontal: 15 },
    catSectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    catScroll: { flexDirection: 'row' },
    catItem: { alignItems: 'center', marginRight: 20 },
    catIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f8f8f8',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 2,
    },
    catIconImg: { width: 50, height: 50, resizeMode: 'contain' },
    catName: { fontSize: 12, fontWeight: '600', color: '#555', marginTop: 8 },

    // Featured section
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 30, marginHorizontal: 15 },
    nearbyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginHorizontal: 15, marginBottom: 10 },

    // Restaurant Card styles (kept but optimized)
    listContent: { paddingBottom: 50 },
    card: {
        backgroundColor: '#fff', marginHorizontal: 15, marginBottom: 15,
        borderRadius: 18, overflow: 'hidden', elevation: 3,
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6,
        flexDirection: 'row', alignItems: 'center',
    },
    imageContainer: { position: 'relative' },
    image: { width: 100, height: 100 },
    imagePlaceholder: { backgroundColor: '#ffeee0', justifyContent: 'center', alignItems: 'center' },
    imagePlaceholderText: { fontSize: 32 },
    closedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
    closedText: { color: '#fff', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
    cardInfo: { flex: 1, padding: 12 },
    restName: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 4 },
    cuisine: { color: '#888', fontSize: 12, marginBottom: 8 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
    ratingText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { color: '#888', fontSize: 12 },
    arrow: { marginRight: 10 },

    // Empty state styles
    emptyContainer: { padding: 60, alignItems: 'center' },
    emptyIcon: { fontSize: 60, marginBottom: 15 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#555' },
    emptySubtitle: { color: '#aaa', marginTop: 8, fontSize: 14 },

    // Floating Icons for Hero Bg
    heroIcon: {
        position: 'absolute',
        width: 30,
        height: 30,
        opacity: 0.15,
        resizeMode: 'contain',
    }
});
