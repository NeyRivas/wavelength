import type { FaqCategory } from "./faq-data";

interface FaqCategoriesProps {
  categories: FaqCategory[];
  activeId: string;
  onSelect: (id: string) => void;
}

/**
 * The four category tabs (Figma reference: a centered pill row, the
 * active tab filled with that category's tint, the rest a plain outlined
 * pill). Purely presentational — the selected id and the click handler
 * both live in the parent (components/landing/faq-section.tsx), so this
 * file needs no state or "use client" of its own.
 */
export function FaqCategories({ categories, activeId, onSelect }: FaqCategoriesProps) {
  return (
    <div className="faq-categories" role="tablist" aria-label="FAQ categories">
      {categories.map((category) => {
        const isActive = category.id === activeId;
        return (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`faq-category${isActive ? ` faq-category--active faq-category--${category.tint}` : ""}`}
            onClick={() => onSelect(category.id)}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
