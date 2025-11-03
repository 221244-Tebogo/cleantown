import React from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import PostCard from '../components/PostCard';

const mockPosts = [
  {
    id: '1',
    user: {
      name: 'Jane Doe',
      avatar: 'https://i.pravatar.cc/150?u=jane',
    },
    image: 'https://picsum.photos/seed/picsum/400/300',
    caption: 'Cleaned up the local park today! 🌳',
  },
  {
    id: '2',
    user: {
      name: 'John Smith',
      avatar: 'https://i.pravatar.cc/150?u=john',
    },
    image: 'https://picsum.photos/seed/picsum2/400/300',
    caption: 'Look at all this trash we collected. #cleantown',
  },
];

const FeedScreen = () => {
  const renderItem = ({ item }) => <PostCard post={item} />;

  return (
    <View style={styles.container}>
        <Text style={styles.h}>Community Feed</Text>
      <FlatList
        data={mockPosts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
   h: { 
    padding: 20,
    fontSize: 20, 
    fontWeight: '800', 
    color: '#0B284A', 
    paddingBottom: 12 
  },
  list: {
    paddingHorizontal: 16,
  },
});

export default FeedScreen;
