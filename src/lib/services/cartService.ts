
import { connectToDatabase } from '@/lib/mongodb';
import type { Cart, CartDoc, CartItem } from '@/types';
import { ObjectId } from 'mongodb';

const CARTS_COLLECTION = 'user_carts';

function docToCart(doc: CartDoc): Cart {
  return {
    _id: doc._id.toString(),
    userId: doc.userId.toString(),
    items: doc.items.map(item => ({ ...item })), // Ensure items are plain objects
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/**
 * Gets a user's cart. If none exists, creates an empty one.
 */
export async function getCartByUserId(userId: string): Promise<Cart> {
  console.log(`[cartService] getCartByUserId called for userId: ${userId}`);
  if (!ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID format for cart retrieval.');
  }

  const { db } = await connectToDatabase();
  const cartsCollection = db.collection<CartDoc>(CARTS_COLLECTION);
  let cartDoc = await cartsCollection.findOne({ userId: new ObjectId(userId) });

  if (!cartDoc) {
    const newCartData: Omit<CartDoc, '_id'> = {
      userId: new ObjectId(userId),
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await cartsCollection.insertOne(newCartData as CartDoc);
    cartDoc = { _id: result.insertedId, ...newCartData };
    console.log(`[cartService] New cart created for userId: ${userId}`);
  }
  return docToCart(cartDoc);
}

/**
 * Adds an item to the cart or updates its quantity if it already exists.
 */
export async function addItemToCart(userId: string, itemToAdd: CartItem): Promise<Cart> {
  console.log(`[cartService] addItemToCart called for userId: ${userId}, item: ${itemToAdd.cartKey}`);
  if (!ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID format for adding to cart.');
  }

  const { db } = await connectToDatabase();
  const cartsCollection = db.collection<CartDoc>(CARTS_COLLECTION);
  const userCart = await getCartByUserId(userId); // Ensures cart exists

  const existingItemIndex = userCart.items.findIndex(item => item.cartKey === itemToAdd.cartKey);

  let updatedItems: CartItem[];
  if (existingItemIndex > -1) {
    updatedItems = userCart.items.map((item, index) =>
      index === existingItemIndex
        ? { ...item, quantity: item.quantity + itemToAdd.quantity }
        : item
    );
  } else {
    updatedItems = [...userCart.items, itemToAdd];
  }

  const result = await cartsCollection.findOneAndUpdate(
    { userId: new ObjectId(userId) },
    { $set: { items: updatedItems, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );

  if (!result) throw new Error('Failed to update cart after adding item.');
  return docToCart(result as CartDoc);
}

/**
 * Updates the quantity of a specific item in the cart. Removes if quantity <= 0.
 */
export async function updateCartItemQuantity(userId: string, cartKey: string, newQuantity: number): Promise<Cart> {
  console.log(`[cartService] updateCartItemQuantity for userId: ${userId}, cartKey: ${cartKey}, newQty: ${newQuantity}`);
  if (!ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID format for updating cart item quantity.');
  }

  const { db } = await connectToDatabase();
  const cartsCollection = db.collection<CartDoc>(CARTS_COLLECTION);
  const userCart = await getCartByUserId(userId);

  let updatedItems: CartItem[];
  if (newQuantity <= 0) {
    updatedItems = userCart.items.filter(item => item.cartKey !== cartKey);
  } else {
    updatedItems = userCart.items.map(item =>
      item.cartKey === cartKey ? { ...item, quantity: newQuantity } : item
    );
    if (!updatedItems.find(item => item.cartKey === cartKey) && newQuantity > 0) {
        console.warn(`[cartService] Attempted to update quantity for non-existent item key ${cartKey}`);
    }
  }

  const result = await cartsCollection.findOneAndUpdate(
    { userId: new ObjectId(userId) },
    { $set: { items: updatedItems, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (!result) throw new Error('Failed to update cart item quantity.');
  return docToCart(result as CartDoc);
}

/**
 * Removes an item from the cart.
 */
export async function removeCartItem(userId: string, cartKey: string): Promise<Cart> {
  console.log(`[cartService] removeCartItem for userId: ${userId}, cartKey: ${cartKey}`);
   if (!ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID format for removing cart item.');
  }
  const { db } = await connectToDatabase();
  const cartsCollection = db.collection<CartDoc>(CARTS_COLLECTION);
  
  const result = await cartsCollection.findOneAndUpdate(
    { userId: new ObjectId(userId) },
    { $pull: { items: { cartKey: cartKey } }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (!result) throw new Error('Failed to remove item from cart or cart not found.');
  return docToCart(result as CartDoc);
}

/**
 * Clears all items from a user's cart.
 */
export async function clearDbCart(userId: string): Promise<Cart> {
  console.log(`[cartService] clearDbCart for userId: ${userId}`);
  if (!ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID format for clearing cart.');
  }
  const { db } = await connectToDatabase();
  const cartsCollection = db.collection<CartDoc>(CARTS_COLLECTION);

  const result = await cartsCollection.findOneAndUpdate(
    { userId: new ObjectId(userId) },
    { $set: { items: [], updatedAt: new Date() } },
    { returnDocument: 'after', upsert: true } 
  );
  if (!result && !(await cartsCollection.findOne({ userId: new ObjectId(userId) }))) {
    const newCartData: Omit<CartDoc, '_id'> = {
        userId: new ObjectId(userId), items: [], createdAt: new Date(), updatedAt: new Date()
    };
    await cartsCollection.insertOne(newCartData as CartDoc);
    return docToCart({_id: new ObjectId(), ...newCartData});
  }
  return docToCart(result as CartDoc);
}
