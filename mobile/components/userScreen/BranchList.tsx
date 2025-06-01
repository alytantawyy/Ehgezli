import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ListRenderItem } from 'react-native';
import { BranchCard } from './BranchCard';
import { BranchListItem } from '@/types/branch';

interface BranchListProps {
  branches: BranchListItem[];
  loading: boolean;
  onBranchPress: (branchId: number) => void;
  renderBranchCard?: (branch: BranchListItem) => React.ReactElement;
}

export const BranchList = ({ branches, loading, onBranchPress, renderBranchCard }: BranchListProps) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B22222" />
        <Text style={styles.loadingText}>Loading restaurants...</Text>
      </View>
    );
  }

  if (branches.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No restaurants found</Text>
        <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
      </View>
    );
  }

  const renderItem: ListRenderItem<BranchListItem> = ({ item }) => {
    if (renderBranchCard) {
      return renderBranchCard(item);
    }
    return <BranchCard branch={item} onPress={onBranchPress} />;
  };

  return (
    <FlatList
      data={branches}
      keyExtractor={(item) => item.branchId.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
