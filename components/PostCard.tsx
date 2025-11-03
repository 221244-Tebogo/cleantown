
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const COLORS = {
  primary: '#0B284A',
  text: '#2B2B2B',
  lightGray: '#F0F0F0',
};

const PostCard = ({ post }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
        <Text style={styles.username}>{post.user.name}</Text>
      </View>
      <Image source={{ uri: post.image }} style={styles.postImage} />
      <View style={styles.captionContainer}>
        <Text style={styles.caption}>{post.caption}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  username: {
    fontWeight: '700',
    fontSize: 16,
    color: COLORS.primary,
  },
  postImage: {
    width: '100%',
    height: 300,
  },
  captionContainer: {
    padding: 12,
  },
  caption: {
    fontSize: 14,
    color: COLORS.text,
  },
});

export default PostCard;
