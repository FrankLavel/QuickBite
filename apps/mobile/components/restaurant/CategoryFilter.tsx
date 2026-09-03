import { ScrollView, TouchableOpacity, Text } from 'react-native';

interface CategoryFilterProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat}
          onPress={() => onSelect(cat)}
          className={`mr-3 px-4 py-2 rounded-full ${selected === cat ? 'bg-primary' : 'bg-gray-100'}`}
        >
          <Text className={selected === cat ? 'text-white font-medium' : 'text-gray-600'}>{cat}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
