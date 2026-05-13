import { Route, Routes } from "react-router-dom";
import { ShoppingList } from "./pages/ShoppingList";

export default function App() {
  return (
    <Routes>
      <Route path="*" element={<ShoppingList />} />
    </Routes>
  );
}
